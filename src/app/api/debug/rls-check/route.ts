import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if the public viewing policy exists
    const { data: policies, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT policyname, permissive, roles, cmd, qual
          FROM pg_policies
          WHERE tablename = 'streams'
          AND schemaname = 'public'
          ORDER BY policyname;
        `
      });

    if (error) {
      // Fallback: Try direct query
      const { data: fallbackPolicies } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'streams');

      return NextResponse.json({
        success: false,
        error: 'Could not query policies directly',
        note: 'Check Supabase dashboard manually',
        fallback: fallbackPolicies
      });
    }

    const hasPublicPolicy = policies?.some((p: any) =>
      p.policyname === 'allow_public_stream_viewing'
    );

    return NextResponse.json({
      success: true,
      has_public_viewing_policy: hasPublicPolicy,
      all_policies: policies,
      diagnosis: hasPublicPolicy
        ? '✅ Public viewing policy EXISTS - mobile should work'
        : '❌ Public viewing policy MISSING - mobile will be blocked'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      instruction: 'Go to Supabase dashboard and run the SQL manually'
    }, { status: 500 });
  }
}
