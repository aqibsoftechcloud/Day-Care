import { z } from "zod";
import { CONTACT_ICON_KEYS, MAX_CONTACT_ITEMS } from "@/types/contact-page-settings";

export const contactItemSchema = z.object({
  icon: z.enum(CONTACT_ICON_KEYS),
  label: z.string().trim().min(1, "Label is required").max(60),
  value: z.string().trim().min(1, "Value is required").max(500),
  visible: z.boolean(),
});

export const contactItemsSchema = z.array(contactItemSchema).max(MAX_CONTACT_ITEMS, `At most ${MAX_CONTACT_ITEMS} contact rows`);

export const updateContactPageSettingsSchema = z.object({
  badge_text: z.string().trim().max(100),
  show_badge: z.boolean(),
  heading: z.string().trim().min(1, "Heading is required").max(255),
  description: z.string().trim().min(1, "Description is required").max(500),
  show_contact_details: z.boolean(),
  contact_items: contactItemsSchema,
  form_position: z.enum(["left", "right"]),
  show_form_heading: z.boolean(),
  meta_title: z.string().trim().max(255),
  meta_description: z.string().trim().max(1000),
  meta_keyword: z.string().trim().max(500),
});

export type UpdateContactPageSettingsInput = z.infer<typeof updateContactPageSettingsSchema>;
