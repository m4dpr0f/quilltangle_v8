import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      creatorWallet,
      nationName,
      soulDescription,
      roadId,
      tek8Guild,
      garuEggQuestion,
      characterName,
      sacredInstrument,
      instrumentElement,
      voiceIsInstrument,
      instrumentProposal,
      crowdfundingPlatform,
      crowdfundingUrl,
      businessDescription,
      arcadeStaffPillars,
      techInnovationType,
      techDescription,
      tokenMintAddress,
      tokenSymbol,
      contactEmail,
      contactTelegram,
      contactDiscord,
      notificationPrefs,
    } = body;

    // Validate required fields
    if (!creatorWallet || !nationName || !soulDescription || !tek8Guild) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required character fields'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!sacredInstrument && !instrumentProposal) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Must select or propose an instrument'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!crowdfundingPlatform || !crowdfundingUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Must provide crowdfunding information'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!techInnovationType || !techDescription) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Must describe technology innovation'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (soulDescription.length < 50 || soulDescription.length > 1000) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Soul description must be 50-1000 characters'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Validate road ID format if provided
    if (roadId) {
      const roadRegex = /^D(2|4|6|8|10|12|20|100)(OUT|UP|DWN|U45|D45)$/;
      if (!roadRegex.test(roadId)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid road ID format'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    const sql = getDb();

    // Check for existing application from this wallet
    const existingApp = await sql`
      SELECT id FROM gcn_applications
      WHERE creator_wallet = ${creatorWallet}
      AND status NOT IN ('rejected', 'withdrawn')
    `;

    if (existingApp.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You already have a pending application'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // If road is selected, check availability
    if (roadId) {
      const roadTaken = await sql`
        SELECT id FROM gcn_applications
        WHERE road_id = ${roadId}
        AND status NOT IN ('rejected', 'withdrawn')
      `;

      if (roadTaken.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'This road is already claimed or pending'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Handle instrument proposal if new instrument
    let finalInstrument = sacredInstrument;
    if (instrumentProposal && !sacredInstrument) {
      // Insert proposal
      await sql`
        INSERT INTO instrument_proposals (name, proposed_element, cultural_origin, description, proposer_wallet)
        VALUES (${instrumentProposal.name}, ${instrumentProposal.element}, ${instrumentProposal.culturalOrigin || null}, ${instrumentProposal.description}, ${creatorWallet})
      `;
      finalInstrument = `proposed:${instrumentProposal.name}`;
    }

    // Insert the application
    const result = await sql`
      INSERT INTO gcn_applications (
        creator_wallet,
        nation_name,
        soul_description,
        road_id,
        tek8_guild,
        garu_egg_question,
        character_name,
        sacred_instrument,
        instrument_element,
        voice_is_instrument,
        crowdfunding_platform,
        crowdfunding_url,
        business_description,
        arcade_staff_pillars,
        tech_innovation_type,
        tech_description,
        token_mint_address,
        token_symbol,
        contact_email,
        contact_telegram,
        contact_discord,
        notification_prefs,
        status
      ) VALUES (
        ${creatorWallet},
        ${nationName},
        ${soulDescription},
        ${roadId || null},
        ${tek8Guild},
        ${garuEggQuestion || null},
        ${characterName || null},
        ${finalInstrument},
        ${instrumentElement || null},
        ${voiceIsInstrument || false},
        ${crowdfundingPlatform},
        ${crowdfundingUrl},
        ${businessDescription || null},
        ${arcadeStaffPillars || []},
        ${techInnovationType},
        ${techDescription},
        ${tokenMintAddress || null},
        ${tokenSymbol || null},
        ${contactEmail || null},
        ${contactTelegram || null},
        ${contactDiscord || null},
        ${notificationPrefs || { email: true, telegram: false, discord: false, in_app: true }},
        'submitted'
      )
      RETURNING id, created_at
    `;

    return new Response(JSON.stringify({
      success: true,
      application: {
        id: result[0].id,
        nationName,
        roadId,
        status: 'submitted',
        createdAt: result[0].created_at
      }
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Application submission error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
