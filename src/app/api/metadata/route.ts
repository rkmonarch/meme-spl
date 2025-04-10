// app/api/metadata/route.ts
import { NextResponse } from "next/server";
import { pinata } from "@/utils/config";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.symbol || !body.image) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: name, symbol, and image are required",
        },
        { status: 400 }
      );
    }

    // Ensure creator object exists
    if (!body.creator) {
      body.creator = {
        name: "anonymous",
      };
    }

    // Format the metadata to match the required structure
    const metadata = {
      name: body.name,
      symbol: body.symbol,
      image: body.image,
      description: body.description || "",
      creator: {
        name: body.creator.name || "anonymous",
        site: body.creator.site || "",
      },
    };

    const response = await pinata.upload.public.json(metadata);

    return NextResponse.json({
      success: true,
      cid: response.cid,
      url: `https://emerald-worldwide-canid-619.mypinata.cloud/ipfs/${response.cid}?pinataGatewayToken=zlPzAkIwACH7RBln8paKhZqDELgPkLj6rcdum_Wc8DiBnRj7M5PP2OMN0sWGEr8x`,
      metadata: metadata,
    });
  } catch (error) {
    console.error("Error uploading metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload metadata" },
      { status: 500 }
    );
  }
}
