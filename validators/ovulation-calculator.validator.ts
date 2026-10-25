import { z } from "zod";

// The only validation this read-only module needs: the route `[id]`
// param. There are no supported query parameters, so no query schema
// is defined — inventing one would add validation for filters that
// don't exist.
export const ovulationCalculatorIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type OvulationCalculatorIdParam = z.infer<
  typeof ovulationCalculatorIdParamSchema
>;
