const POKEDATA_IMAGE_HOST = "pokemonproductimages.pokedata.io";
const POKEDATA_IMAGE_PATH = "/Products/";

function errorResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export async function handleProductImage(request: Request): Promise<Response | null> {
  const requestUrl = new URL(request.url);
  if (requestUrl.pathname !== "/api/product-image") return null;
  if (request.method !== "GET") return errorResponse("Method not allowed", 405);

  const sourceValue = requestUrl.searchParams.get("url");
  if (!sourceValue) return errorResponse("Missing image URL", 400);

  let source: URL;
  try {
    source = new URL(sourceValue);
  } catch {
    return errorResponse("Invalid image URL", 400);
  }

  if (
    source.protocol !== "https:" ||
    source.hostname !== POKEDATA_IMAGE_HOST ||
    !source.pathname.startsWith(POKEDATA_IMAGE_PATH)
  ) {
    return errorResponse("Image source is not allowed", 403);
  }

  const upstream = await fetch(source.toString(), {
    headers: { Accept: "image/avif,image/webp,image/*" },
  });
  const contentType = upstream.headers.get("Content-Type") || "";
  if (!upstream.ok || !contentType.toLowerCase().startsWith("image/")) {
    return errorResponse("Image is unavailable", upstream.ok ? 502 : upstream.status);
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
