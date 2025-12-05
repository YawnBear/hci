import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const location = searchParams.get("location_name")?.toLowerCase();
        console.log(request.url);

        const response = await fetch(`https://api.data.gov.my/weather/forecast`);

        if (!response.ok) {
            throw new Error('Weather API request failed');
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            data: data      // ← this is the whole file
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
