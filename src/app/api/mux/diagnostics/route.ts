import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    console.log('🔍 Running RTMP connectivity diagnostics...');

    const diagnostics = {
      timestamp: new Date().toISOString(),
      tests: {} as any,
      recommendations: [] as string[]
    };

    // Test 1: DNS resolution for Mux RTMP server
    try {
      const { stdout: nslookupResult } = await execAsync('nslookup global-live.mux.com');
      diagnostics.tests.dns_resolution = {
        success: true,
        result: nslookupResult.includes('Address:'),
        details: nslookupResult
      };
    } catch (error) {
      diagnostics.tests.dns_resolution = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      diagnostics.recommendations.push('DNS resolution failed - check internet connectivity');
    }

    // Test 2: Ping test to Mux servers
    try {
      const { stdout: pingResult } = await execAsync('ping -n 4 global-live.mux.com');
      const success = pingResult.includes('Reply from') || pingResult.includes('bytes from');
      diagnostics.tests.ping_test = {
        success: success,
        result: success ? 'Server reachable' : 'Server not responding to ping',
        details: pingResult
      };

      if (!success) {
        diagnostics.recommendations.push('Mux servers not responding - check firewall/network');
      }
    } catch (error) {
      diagnostics.tests.ping_test = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      diagnostics.recommendations.push('Ping test failed - network connectivity issues');
    }

    // Test 3: Check if port 1935 (RTMP) might be blocked
    try {
      // Use telnet-like test with PowerShell
      const portTestCmd = `powershell -Command "Test-NetConnection -ComputerName global-live.mux.com -Port 1935 -InformationLevel Quiet"`;
      const { stdout: portResult } = await execAsync(portTestCmd);
      const portOpen = portResult.trim() === 'True';

      diagnostics.tests.rtmp_port_test = {
        success: portOpen,
        result: portOpen ? 'Port 1935 accessible' : 'Port 1935 blocked or filtered',
        port: 1935,
        protocol: 'RTMP'
      };

      if (!portOpen) {
        diagnostics.recommendations.push('CRITICAL: Port 1935 (RTMP) appears blocked - check Windows Firewall and router settings');
        diagnostics.recommendations.push('Try temporarily disabling Windows Firewall to test');
        diagnostics.recommendations.push('Contact network administrator if on corporate network');
      }
    } catch (error) {
      diagnostics.tests.rtmp_port_test = {
        success: false,
        error: error instanceof Error ? error.message : 'Could not test port connectivity',
        note: 'Port test requires PowerShell and may not work on all systems'
      };
      diagnostics.recommendations.push('Could not test RTMP port - manually check firewall settings');
    }

    // Test 4: Windows Firewall status
    try {
      const { stdout: firewallResult } = await execAsync('netsh advfirewall show currentprofile');
      const firewallOn = firewallResult.includes('State                                 ON');

      diagnostics.tests.windows_firewall = {
        success: true,
        firewall_enabled: firewallOn,
        result: firewallOn ? 'Windows Firewall is ON' : 'Windows Firewall is OFF',
        details: firewallOn ? 'Firewall may be blocking RTMP traffic' : 'Firewall should not be blocking traffic'
      };

      if (firewallOn) {
        diagnostics.recommendations.push('Windows Firewall is ON - may need to allow OBS through firewall');
        diagnostics.recommendations.push('Add OBS Studio as firewall exception or temporarily disable firewall to test');
      }
    } catch (error) {
      diagnostics.tests.windows_firewall = {
        success: false,
        error: 'Could not check Windows Firewall status'
      };
    }

    // Overall assessment
    const criticalIssues = diagnostics.recommendations.filter(r => r.includes('CRITICAL')).length;
    const hasNetworkIssues = !diagnostics.tests.dns_resolution?.success ||
                            !diagnostics.tests.ping_test?.success ||
                            !diagnostics.tests.rtmp_port_test?.success;

    diagnostics.overall_status = criticalIssues > 0 ? 'CRITICAL_ISSUES' :
                               hasNetworkIssues ? 'NETWORK_ISSUES' : 'LIKELY_OK';

    if (diagnostics.recommendations.length === 0) {
      diagnostics.recommendations.push('All network tests passed - issue may be with OBS configuration');
      diagnostics.recommendations.push('Double-check OBS settings: Service=Custom, Server and Stream Key exact match');
      diagnostics.recommendations.push('Try restarting OBS completely');
    }

    return NextResponse.json({
      success: true,
      diagnostics: diagnostics,
      next_steps: diagnostics.overall_status === 'CRITICAL_ISSUES' ?
        ['Fix network/firewall issues before testing OBS'] :
        ['Test OBS with fresh stream credentials', 'Monitor connection in OBS logs']
    });

  } catch (error) {
    console.error('❌ Diagnostics failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Could not run complete diagnostics',
      basic_recommendations: [
        'Check Windows Firewall settings',
        'Ensure OBS Studio is allowed through firewall',
        'Verify internet connectivity',
        'Try temporarily disabling antivirus/firewall to test'
      ]
    }, { status: 500 });
  }
}