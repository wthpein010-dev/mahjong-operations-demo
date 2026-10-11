export function GET(request:Request){return Response.redirect(new URL('/reference/openapi.json',request.url),302)}
