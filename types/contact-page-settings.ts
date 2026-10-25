/** Icons an admin can pick for a contact row. Fixed set — the public page maps each key to a lucide icon; nothing free-form reaches the renderer. */
export const CONTACT_ICON_KEYS = ["email", "phone", "location", "clock", "globe", "message"] as const;
export type ContactIconKey = (typeof CONTACT_ICON_KEYS)[number];

export const CONTACT_ICON_LABELS: Record<ContactIconKey, string> = {
  email: "Email",
  phone: "Phone",
  location: "Location",
  clock: "Opening hours",
  globe: "Website",
  message: "Message",
};

export type ContactItem = {
  icon: ContactIconKey;
  /** Small caption above the value, e.g. "Email:". */
  label: string;
  value: string;
  /** Hidden rows stay saved but are not shown publicly. */
  visible: boolean;
};

export type ContactFormPosition = "left" | "right";

/** Everything editable on /contact-us EXCEPT the form, which is always the shared AppointmentLeadForm driven by Consultation Form Settings. */
export type ContactPageSettings = {
  badge_text: string;
  show_badge: boolean;
  heading: string;
  description: string;
  show_contact_details: boolean;
  /** Array order IS the display order. */
  contact_items: ContactItem[];
  form_position: ContactFormPosition;
  /** The reference design shows the form with no title block; the shared form's title/description can be switched on here. */
  show_form_heading: boolean;
  meta_title: string;
  meta_description: string;
  meta_keyword: string;
};

export const MAX_CONTACT_ITEMS = 8;

/**
 * Used only when no row has been saved yet. Deliberately contains NO
 * contact details — phone/email/address are never invented; an admin adds
 * them in the admin panel.
 */
export const DEFAULT_CONTACT_PAGE_SETTINGS: ContactPageSettings = {
  badge_text: "Contact",
  show_badge: true,
  heading: "How can we help you today?",
  description: "Our dedicated customer support team is just a message or call away.",
  show_contact_details: true,
  contact_items: [],
  form_position: "right",
  show_form_heading: false,
  meta_title: "Contact Us",
  meta_description: "Contact the Day Care Surgeries team. Request a free consultation and our care team will call you back.",
  meta_keyword: "",
};
