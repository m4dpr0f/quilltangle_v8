import type { APIRoute } from 'astro';

/**
 * Image Upload to Pinata IPFS
 *
 * Handles image uploads for token metadata.
 * Pinata free tier: 1GB storage, 100 files
 *
 * Set these env vars:
 *   PINATA_JWT - Your Pinata JWT token
 *   PINATA_GATEWAY - Optional custom gateway (default: gateway.pinata.cloud)
 */

const PINATA_API = 'https://api.pinata.cloud';
const PINATA_GATEWAY = import.meta.env.PINATA_GATEWAY || 'gateway.pinata.cloud';

export const POST: APIRoute = async ({ request }) => {
  try {
    const pinataJwt = import.meta.env.PINATA_JWT;

    if (!pinataJwt) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Image upload not configured. Please add PINATA_JWT to environment.',
        fallback: 'You can manually upload to IPFS and paste the URL.',
      }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    const contentType = request.headers.get('content-type') || '';

    let formData: FormData;
    let file: File | null = null;
    let fileName = 'token-image';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      formData = await request.formData();
      file = formData.get('file') as File;
      fileName = formData.get('name')?.toString() || file?.name || 'token-image';

      if (!file) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No file provided',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        return new Response(JSON.stringify({
          success: false,
          error: 'File too large. Max 5MB.',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content-Type must be multipart/form-data',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Upload to Pinata
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);

    const metadata = {
      name: fileName,
      keyvalues: {
        platform: '8xM',
        type: 'token-image',
      },
    };
    pinataFormData.append('pinataMetadata', JSON.stringify(metadata));

    const pinataOptions = {
      cidVersion: 1,
    };
    pinataFormData.append('pinataOptions', JSON.stringify(pinataOptions));

    const uploadResponse = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJwt}`,
      },
      body: pinataFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Pinata upload error:', errorText);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to upload to IPFS',
        details: errorText,
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const pinataResult = await uploadResponse.json();
    const ipfsHash = pinataResult.IpfsHash;

    // Generate URLs
    const ipfsUrl = `ipfs://${ipfsHash}`;
    const gatewayUrl = `https://${PINATA_GATEWAY}/ipfs/${ipfsHash}`;

    return new Response(JSON.stringify({
      success: true,
      ipfsHash,
      ipfsUrl,
      gatewayUrl,
      message: 'Image uploaded to IPFS successfully',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

/**
 * Also support uploading JSON metadata for tokens
 */
export const PUT: APIRoute = async ({ request }) => {
  try {
    const pinataJwt = import.meta.env.PINATA_JWT;

    if (!pinataJwt) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Metadata upload not configured. Please add PINATA_JWT to environment.',
      }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const { name, symbol, description, image, attributes, externalUrl } = body;

    if (!name || !image) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: name, image',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Create token metadata following Metaplex standard
    const metadata = {
      name,
      symbol: symbol || '',
      description: description || '',
      image,
      external_url: externalUrl || 'https://8xm.quilu.xyz',
      attributes: attributes || [],
      properties: {
        category: 'token',
        creators: [],
      },
    };

    const pinataResponse = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${symbol || name}-metadata`,
          keyvalues: {
            platform: '8xM',
            type: 'token-metadata',
          },
        },
      }),
    });

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to upload metadata to IPFS',
        details: errorText,
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const pinataResult = await pinataResponse.json();
    const ipfsHash = pinataResult.IpfsHash;

    return new Response(JSON.stringify({
      success: true,
      ipfsHash,
      metadataUri: `https://${PINATA_GATEWAY}/ipfs/${ipfsHash}`,
      message: 'Token metadata uploaded to IPFS',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Metadata upload error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
