'use client';

/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by monitoring service health and failing fast when needed
 */

import { analytics } from '@/lib/monitoring/analytics';

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing fast, not calling service
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening circuit
  resetTimeout: number;        // Time to wait before trying again (ms)
  monitoringPeriod: number;    // Time window for failure counting (ms)
  successThreshold: number;    // Successful calls needed to close circuit from half-open
}

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  nextAttempt: number;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      resetTimeout: config.resetTimeout ?? 60000, // 1 minute
      monitoringPeriod: config.monitoringPeriod ?? 300000, // 5 minutes
      successThreshold: config.successThreshold ?? 3
    };

    this.state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      nextAttempt: 0
    };

    console.log(`🔧 Circuit breaker '${this.name}' initialized`);
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state.state === CircuitState.OPEN) {
      if (Date.now() < this.state.nextAttempt) {
        throw new Error(`Circuit breaker '${this.name}' is OPEN. Next attempt at ${new Date(this.state.nextAttempt).toISOString()}`);
      }
      // Move to half-open to test if service has recovered
      this.state.state = CircuitState.HALF_OPEN;
      this.state.successCount = 0;
      console.log(`🔄 Circuit breaker '${this.name}' moving to HALF_OPEN`);
    }

    try {
      const result = await fn();

      // Success
      this.onSuccess();
      return result;

    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.resetFailureCount();

    if (this.state.state === CircuitState.HALF_OPEN) {
      this.state.successCount++;

      if (this.state.successCount >= this.config.successThreshold) {
        this.state.state = CircuitState.CLOSED;
        console.log(`✅ Circuit breaker '${this.name}' CLOSED after recovery`);

        analytics.trackEvent('circuit_breaker_closed', {
          circuitName: this.name,
          recoveryTime: Date.now() - this.state.lastFailureTime
        });
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureTime = Date.now();

    // Clean up old failures outside monitoring period
    if (Date.now() - this.state.lastFailureTime > this.config.monitoringPeriod) {
      this.resetFailureCount();
    }

    if (this.state.state === CircuitState.HALF_OPEN) {
      // Failed during recovery test, go back to open
      this.openCircuit();
    } else if (this.state.failureCount >= this.config.failureThreshold) {
      // Too many failures, open circuit
      this.openCircuit();
    }

    analytics.trackEvent('circuit_breaker_failure', {
      circuitName: this.name,
      failureCount: this.state.failureCount,
      state: this.state.state
    });
  }

  /**
   * Open the circuit breaker
   */
  private openCircuit(): void {
    this.state.state = CircuitState.OPEN;
    this.state.nextAttempt = Date.now() + this.config.resetTimeout;

    console.warn(`🚨 Circuit breaker '${this.name}' OPENED after ${this.state.failureCount} failures`);

    analytics.trackEvent('circuit_breaker_opened', {
      circuitName: this.name,
      failureCount: this.state.failureCount,
      nextAttempt: this.state.nextAttempt
    });
  }

  /**
   * Reset failure count
   */
  private resetFailureCount(): void {
    if (this.state.failureCount > 0) {
      this.state.failureCount = 0;
      this.state.lastFailureTime = 0;
    }
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    nextAttempt?: number;
    isHealthy: boolean;
  } {
    return {
      state: this.state.state,
      failureCount: this.state.failureCount,
      successCount: this.state.successCount,
      nextAttempt: this.state.state === CircuitState.OPEN ? this.state.nextAttempt : undefined,
      isHealthy: this.state.state === CircuitState.CLOSED
    };
  }

  /**
   * Manually reset circuit breaker (admin function)
   */
  reset(): void {
    this.state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      nextAttempt: 0
    };

    console.log(`🔄 Circuit breaker '${this.name}' manually reset`);

    analytics.trackEvent('circuit_breaker_reset', {
      circuitName: this.name,
      manual: true
    });
  }
}

/**
 * Global circuit breaker registry
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  getBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get status of all circuit breakers
   */
  getAllStatus(): Record<string, ReturnType<CircuitBreaker['getStatus']>> {
    const status: Record<string, ReturnType<CircuitBreaker['getStatus']>> = {};

    this.breakers.forEach((breaker, name) => {
      status[name] = breaker.getStatus();
    });

    return status;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

// Export singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// Convenient function to get a circuit breaker
export function getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  return circuitBreakerRegistry.getBreaker(name, config);
}