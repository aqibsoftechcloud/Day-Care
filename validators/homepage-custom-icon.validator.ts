import { z } from "zod";

/** The upload itself has no Zod-validated body — content validation (real decodable image / sanitized SVG) happens in `services/homepage-custom-icon.service.ts`, which needs the actual file bytes, not something Zod can check. This schema only covers the id-param routes. */
export const homepageCustomIconIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type HomepageCustomIconIdParam = z.infer<typeof homepageCustomIconIdParamSchema>;
