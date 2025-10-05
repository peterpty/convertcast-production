/**
 * Contact Sync API Route
 * POST /api/integrations/[id]/sync - Sync contacts from integration service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdapterFromDb } from '@/lib/integrations/factory';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/integrations/[id]/sync
 * Sync contacts from the external service to our database
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: integrationId } = await context.params;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting contact sync:', { integrationId, user: user.email });

    // Get integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { success: false, error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Check if integration supports contact sync
    if (!integration.capabilities?.contacts) {
      return NextResponse.json(
        { success: false, error: 'This integration does not support contact sync' },
        { status: 400 }
      );
    }

    // Create adapter
    const adapter = await createAdapterFromDb(integration);

    // Sync contacts
    const syncResult = await adapter.syncContacts();

    if (!syncResult.success) {
      console.error('❌ Contact sync failed:', syncResult.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Contact sync failed',
          details: syncResult.errors,
        },
        { status: 500 }
      );
    }

    console.log(`✅ Synced ${syncResult.syncedCount} contacts`);

    // Save contacts to database
    const contactsToInsert = syncResult.contacts.map(contact => ({
      integration_id: integrationId,
      user_id: user.id,
      external_id: contact.id,
      email: contact.email,
      phone: contact.phone,
      first_name: contact.firstName,
      last_name: contact.lastName,
      tags: contact.tags || [],
      lists: contact.lists || [],
      custom_fields: contact.customFields || {},
      sync_status: 'synced' as const,
      synced_at: new Date().toISOString(),
      consent_email: contact.consent?.email ?? true,
      consent_sms: contact.consent?.sms ?? false,
      consent_date: contact.consent?.date?.toISOString(),
      consent_ip: contact.consent?.ip,
    }));

    // Delete existing contacts for this integration (full sync)
    await supabase
      .from('integration_contacts')
      .delete()
      .eq('integration_id', integrationId)
      .eq('user_id', user.id);

    // Insert new contacts in batches (Supabase has a limit)
    const batchSize = 1000;
    let insertedCount = 0;

    for (let i = 0; i < contactsToInsert.length; i += batchSize) {
      const batch = contactsToInsert.slice(i, i + batchSize);

      const { error: insertError } = await supabase
        .from('integration_contacts')
        .insert(batch);

      if (insertError) {
        console.error('⚠️ Failed to insert batch:', insertError);
      } else {
        insertedCount += batch.length;
      }
    }

    console.log(`✅ Inserted ${insertedCount} contacts into database`);

    return NextResponse.json({
      success: true,
      syncedCount: syncResult.syncedCount,
      insertedCount,
      failedCount: syncResult.failedCount,
      message: `Successfully synced ${syncResult.syncedCount} contacts`,
    });
  } catch (error) {
    console.error('❌ Error syncing contacts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
