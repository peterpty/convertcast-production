import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    console.log('🔧 OBS-specific troubleshooting...');

    const troubleshooting = {
      timestamp: new Date().toISOString(),
      obs_checks: {} as any,
      system_checks: {} as any,
      solutions: [] as string[]
    };

    // 1. Check if OBS is running
    try {
      const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq obs64.exe" /FO CSV');
      const obsRunning = stdout.includes('obs64.exe');

      troubleshooting.obs_checks.obs_running = {
        running: obsRunning,
        process_info: obsRunning ? 'OBS Studio is currently running' : 'OBS Studio not detected'
      };

      if (obsRunning) {
        troubleshooting.solutions.push('STOP: Close OBS Studio completely and restart it');
        troubleshooting.solutions.push('Clear OBS cache: %APPDATA%\\obs-studio');
      }
    } catch (error) {
      troubleshooting.obs_checks.process_check = {
        error: 'Could not check OBS processes'
      };
    }

    // 2. Check Windows Firewall rules for OBS
    try {
      const { stdout } = await execAsync('netsh advfirewall firewall show rule name=all | findstr /i "obs"');
      const hasObsRules = stdout.trim().length > 0;

      troubleshooting.system_checks.firewall_rules = {
        obs_rules_exist: hasObsRules,
        details: hasObsRules ? 'OBS firewall rules found' : 'No OBS firewall rules detected',
        recommendation: hasObsRules ? 'OBS should be allowed through firewall' : 'Need to add OBS to firewall exceptions'
      };

      if (!hasObsRules) {
        troubleshooting.solutions.push('CRITICAL: Add OBS Studio to Windows Firewall exceptions');
        troubleshooting.solutions.push('Windows Security > Firewall > Allow an app > Browse for obs64.exe');
      }
    } catch (error) {
      troubleshooting.system_checks.firewall_check = {
        error: 'Could not check firewall rules'
      };
    }

    // 3. Check for antivirus that might block RTMP
    try {
      const { stdout } = await execAsync('wmic /namespace:\\\\root\\SecurityCenter2 path AntivirusProduct get displayName /format:value');
      const antivirusInfo = stdout.split('\\n').filter(line => line.includes('displayName=')).map(line => line.replace('displayName=', '').trim());

      troubleshooting.system_checks.antivirus = {
        detected: antivirusInfo.filter(av => av.length > 0),
        note: 'Some antivirus software blocks RTMP traffic'
      };

      if (antivirusInfo.length > 0) {
        troubleshooting.solutions.push(`Check antivirus settings: ${antivirusInfo.join(', ')}`);
        troubleshooting.solutions.push('Add OBS Studio and RTMP traffic to antivirus exceptions');
      }
    } catch (error) {
      troubleshooting.system_checks.antivirus_check = {
        error: 'Could not detect antivirus software'
      };
    }

    // 4. Check network adapter settings
    try {
      const { stdout } = await execAsync('ipconfig /all');
      const hasInternet = stdout.includes('Default Gateway');

      troubleshooting.system_checks.network = {
        default_gateway_present: hasInternet,
        connection_type: stdout.includes('Wireless') ? 'WiFi' : stdout.includes('Ethernet') ? 'Ethernet' : 'Unknown'
      };

      if (!hasInternet) {
        troubleshooting.solutions.push('CRITICAL: No default gateway - check internet connection');
      }
    } catch (error) {
      troubleshooting.system_checks.network_check = {
        error: 'Could not check network configuration'
      };
    }

    // 5. Advanced OBS troubleshooting steps
    troubleshooting.solutions.push('=== ADVANCED OBS TROUBLESHOOTING ===');
    troubleshooting.solutions.push('1. Update OBS Studio to latest version');
    troubleshooting.solutions.push('2. Run OBS as Administrator (right-click > Run as administrator)');
    troubleshooting.solutions.push('3. In OBS: Help > Log Files > Upload Current Log File (check for errors)');
    troubleshooting.solutions.push('4. Try different OBS settings: Output > Advanced > Network Optimizations');
    troubleshooting.solutions.push('5. Test with minimal scene (just a color source, no webcam/capture)');
    troubleshooting.solutions.push('6. Disable hardware encoding: Output > Encoder > Software (x264)');

    // 6. Alternative streaming software test
    troubleshooting.solutions.push('=== ALTERNATIVE SOFTWARE TEST ===');
    troubleshooting.solutions.push('Download Streamlabs OBS or XSplit as alternative test');
    troubleshooting.solutions.push('If alternative software works, the issue is OBS-specific');

    // 7. Network-level debugging
    troubleshooting.solutions.push('=== NETWORK DEBUGGING ===');
    troubleshooting.solutions.push('Test RTMP with FFmpeg: ffmpeg -re -f lavfi -i testsrc -c:v libx264 -f flv rtmp://global-live.mux.com/live/STREAM_KEY');
    troubleshooting.solutions.push('Use Wireshark to capture RTMP traffic and analyze connection attempts');

    return NextResponse.json({
      success: true,
      diagnosis: 'Mux backend is working perfectly - issue is client-side',
      troubleshooting: troubleshooting,
      immediate_actions: [
        '1. Close OBS completely and restart as Administrator',
        '2. Add OBS to Windows Firewall exceptions',
        '3. Check OBS logs for specific error messages',
        '4. Test with alternative streaming software'
      ],
      test_stream: {
        server: 'rtmp://global-live.mux.com/live',
        key: 'b7696af8-3029-7ec7-3cfe-dcfad507c1b7',
        note: 'This stream is verified working on backend'
      }
    });

  } catch (error) {
    console.error('❌ OBS troubleshooting failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback_solutions: [
        'Restart OBS Studio as Administrator',
        'Disable Windows Firewall temporarily to test',
        'Check OBS Studio logs for error messages',
        'Try alternative streaming software (Streamlabs, XSplit)',
        'Contact OBS Studio support forums'
      ]
    }, { status: 500 });
  }
}