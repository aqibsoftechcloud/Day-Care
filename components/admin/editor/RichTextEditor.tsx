"use client";

import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table/kit";
import { Placeholder } from "@tiptap/extensions/placeholder";
import { CharacterCount } from "@tiptap/extensions/character-count";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code2,
  Columns3,
  Eraser,
  Eye,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Redo2,
  Rows3,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { isEmptyEditorHtml, isSafeUrl, toEditorContent } from "@/lib/rich-text";
import { sanitizeEditorHtml } from "@/lib/sanitize-html";
import { notify } from "@/lib/toast";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  id?: string;
};

const HEADING_LEVELS = [1, 2, 3, 4] as const;
type HeadingLevel = (typeof HEADING_LEVELS)[number];

const ALIGN_OPTIONS = [
  { value: "left", icon: AlignLeft, label: "Align left" },
  { value: "center", icon: AlignCenter, label: "Align center" },
  { value: "right", icon: AlignRight, label: "Align right" },
  { value: "justify", icon: AlignJustify, label: "Justify" },
] as const;

/** The reactive slice of editor state the toolbar needs — recomputed via `useEditorState` so toolbar buttons stay in sync with the selection without re-rendering on every keystroke. */
type ToolbarEditorState = {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrike: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  isBlockquote: boolean;
  isLink: boolean;
  isImage: boolean;
  isTable: boolean;
  headingLevel: HeadingLevel | null;
  align: (typeof ALIGN_OPTIONS)[number]["value"];
  canUndo: boolean;
  canRedo: boolean;
  words: number;
  characters: number;
};

/**
 * The one reusable rich-text editor for every LongText content field in the
 * CMS (currently Page.body and DoctorPage.description) — a Tiptap-based
 * editor producing HTML, which is what those fields already store (no
 * backend/validator change). Wire it into React Hook Form the same way as
 * any other controlled field: `<Controller render={({field}) => <RichTextEditor value={field.value} onChange={field.onChange} />} />`.
 */
export function RichTextEditor({ value, onChange, placeholder, disabled, error, id }: RichTextEditorProps) {
  // Read once as the editor's initial content — the parent form remounts
  // this whole component (via a `key` on the record id) when switching
  // records, so there's no need to push external `value` changes back
  // into an already-created editor (that would fight the user's cursor).
  const [initialContent] = useState(() => toEditorContent(value));

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    content: initialContent,
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        heading: { levels: [...HEADING_LEVELS] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
          HTMLAttributes: { rel: "noopener noreferrer nofollow" },
          isAllowedUri: (url, ctx) => isSafeUrl(url) && ctx.defaultValidate(url),
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      AlignableImage.configure({ inline: false }),
      TableKit.configure({ table: { resizable: true } }),
      Placeholder.configure({ placeholder: placeholder ?? "Start writing your content..." }),
      CharacterCount,
    ],
    editorProps: {
      attributes: {
        class: "rte-content",
        ...(id ? { id } : {}),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(isEmptyEditorHtml(html) ? "" : html);
    },
  });

  // Imperative sync of an external prop into the editor instance — not a
  // React state update, so this isn't the setState-in-effect pattern that
  // rule guards against.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  // HTML source mode: a plain textarea showing/editing the editor's raw
  // HTML, alongside (not replacing) the normal Tiptap visual editor.
  // `htmlDraft` is intentionally separate from `initialContent`/the
  // Tiptap document itself — it only exists while `mode === "html"`.
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [htmlDraft, setHtmlDraft] = useState("");

  function switchToHtmlMode() {
    if (!editor) return;
    setHtmlDraft(editor.getHTML());
    setMode("html");
  }

  function switchToVisualMode() {
    if (!editor) return;
    const { html, wasModified } = sanitizeEditorHtml(htmlDraft);
    // `emitUpdate` defaults to true, so this fires the same `onUpdate`
    // handler a normal visual edit would — the parent form's `onChange`
    // gets the sanitized HTML exactly as if the admin had typed it via
    // the toolbar, no separate save path.
    editor.commands.setContent(html);
    if (wasModified) {
      notify.warning("Some HTML was removed for safety before loading it into the editor.");
    }
    setMode("visual");
  }

  function handleHtmlDraftChange(raw: string) {
    setHtmlDraft(raw);
    // Keeps the parent's saved value live and already-sanitized even if
    // the admin submits the form without ever switching back to Visual
    // mode — the textarea itself still shows their raw, unsanitized
    // keystrokes (no cursor-jumping re-sanitized text fighting them as
    // they type); only the value handed to `onChange` is sanitized.
    const { html } = sanitizeEditorHtml(raw);
    onChange(isEmptyEditorHtml(html) ? "" : html);
  }

  const state = useEditorState({
    editor,
    selector: ({ editor }: { editor: Editor | null }): ToolbarEditorState | null => {
      if (!editor) return null;
      const headingLevel = HEADING_LEVELS.find((level) => editor.isActive("heading", { level })) ?? null;
      const align = ALIGN_OPTIONS.find((option) => editor.isActive({ textAlign: option.value }))?.value ?? "left";
      return {
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isUnderline: editor.isActive("underline"),
        isStrike: editor.isActive("strike"),
        isBulletList: editor.isActive("bulletList"),
        isOrderedList: editor.isActive("orderedList"),
        isBlockquote: editor.isActive("blockquote"),
        isLink: editor.isActive("link"),
        isImage: editor.isActive("image"),
        isTable: editor.isActive("table"),
        headingLevel,
        align,
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
        words: editor.storage.characterCount?.words() ?? 0,
        characters: editor.storage.characterCount?.characters() ?? 0,
      };
    },
  });

  if (!editor || !state) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-input text-body-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  return (
    <div
      aria-invalid={!!error || undefined}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-input bg-transparent transition-colors",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        disabled && "opacity-50"
      )}
    >
      {mode === "visual" ? (
        <Toolbar editor={editor} state={state} disabled={!!disabled} onSwitchToHtml={switchToHtmlMode} />
      ) : (
        <HtmlModeToolbar disabled={!!disabled} onSwitchToVisual={switchToVisualMode} />
      )}

      {mode === "visual" && state.isTable && <TableToolbar editor={editor} disabled={!!disabled} />}

      {mode === "visual" ? (
        <EditorContent
          editor={editor}
          className="min-h-[420px] max-h-[600px] flex-1 overflow-y-auto px-3.5 py-3"
        />
      ) : (
        <textarea
          value={htmlDraft}
          onChange={(event) => handleHtmlDraftChange(event.target.value)}
          disabled={disabled}
          spellCheck={false}
          aria-label="HTML source"
          className="min-h-[420px] max-h-[600px] flex-1 resize-none overflow-y-auto bg-transparent px-3.5 py-3 font-mono text-body-sm text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="<p>Write raw HTML here…</p>"
        />
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border px-3.5 py-1.5">
        {mode === "visual" ? (
          <span className="text-helper">
            Words: {state.words} · Characters: {state.characters}
          </span>
        ) : (
          <span className="text-helper">Editing raw HTML — switch to Visual Editor to see the formatted result.</span>
        )}
      </div>
    </div>
  );
}

// The base Image node doesn't carry an alignment attribute — this adds one
// (rendered as `data-align`, styled in globals.css) purely as presentation,
// no new content type or backend concept.
const AlignableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-align": attributes.align,
          class: `rte-img-align-${attributes.align}`,
        }),
      },
    };
  },
});

function Toolbar({
  editor,
  state,
  disabled,
  onSwitchToHtml,
}: {
  editor: Editor;
  state: ToolbarEditorState;
  disabled: boolean;
  onSwitchToHtml: () => void;
}) {
  const currentBlockLabel = state.headingLevel ? `Heading ${state.headingLevel}` : "Paragraph";

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="w-[124px] justify-between font-normal"
          >
            {currentBlockLabel}
            <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onSelect={() => editor.chain().focus().setParagraph().run()}>
            Paragraph
          </DropdownMenuItem>
          {HEADING_LEVELS.map((level) => (
            <DropdownMenuItem key={level} onSelect={() => editor.chain().focus().toggleHeading({ level }).run()}>
              Heading {level}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarSeparator />

      <ToolbarButton icon={Bold} label="Bold" active={state.isBold} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton icon={Italic} label="Italic" active={state.isItalic} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton icon={UnderlineIcon} label="Underline" active={state.isUnderline} disabled={disabled} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <ToolbarButton icon={Strikethrough} label="Strikethrough" active={state.isStrike} disabled={disabled} onClick={() => editor.chain().focus().toggleStrike().run()} />

      <ToolbarSeparator />

      <ToolbarButton icon={List} label="Bullet list" active={state.isBulletList} disabled={disabled} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton icon={ListOrdered} label="Numbered list" active={state.isOrderedList} disabled={disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()} />

      <ToolbarSeparator />

      {ALIGN_OPTIONS.map((option) => (
        <ToolbarButton
          key={option.value}
          icon={option.icon}
          label={option.label}
          active={state.align === option.value}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign(option.value).run()}
        />
      ))}

      <ToolbarSeparator />

      <LinkControl editor={editor} isActive={state.isLink} disabled={disabled} />
      <ImageControl editor={editor} isActive={state.isImage} disabled={disabled} />

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} aria-label="Insert" className="text-muted-foreground hover:bg-muted hover:text-foreground">
                <Plus className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Insert</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon aria-hidden="true" /> Table
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote aria-hidden="true" /> Blockquote
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus aria-hidden="true" /> Horizontal rule
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarButton
        icon={Eraser}
        label="Clear formatting"
        disabled={disabled}
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      />

      <ToolbarSeparator />

      <ToolbarButton icon={Undo2} label="Undo" disabled={disabled || !state.canUndo} onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton icon={Redo2} label="Redo" disabled={disabled || !state.canRedo} onClick={() => editor.chain().focus().redo().run()} />

      <ToolbarSeparator />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={onSwitchToHtml}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Code2 className="size-4" aria-hidden="true" />
            HTML
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Edit raw HTML</TooltipContent>
      </Tooltip>
    </div>
  );
}

/** Shown in place of the full formatting toolbar while editing raw HTML — every button above acts on the Tiptap editor's selection/state, none of which applies to a plain textarea, so only the one control that matters here (switch back) is shown. */
function HtmlModeToolbar({ disabled, onSwitchToVisual }: { disabled: boolean; onSwitchToVisual: () => void }) {
  return (
    <div className="flex items-center gap-0.5 border-b border-border bg-muted/30 p-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onSwitchToVisual}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Eye className="size-4" aria-hidden="true" />
        Visual Editor
      </Button>
    </div>
  );
}

function TableToolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-accent/40 px-2 py-1">
      <span className="pl-1 text-caption">Table:</span>
      <TableTextButton icon={Rows3} label="Add row" disabled={disabled} onClick={() => editor.chain().focus().addRowAfter().run()} />
      <TableTextButton icon={Columns3} label="Add column" disabled={disabled} onClick={() => editor.chain().focus().addColumnAfter().run()} />
      <TableTextButton icon={Rows3} label="Delete row" disabled={disabled} onClick={() => editor.chain().focus().deleteRow().run()} />
      <TableTextButton icon={Columns3} label="Delete column" disabled={disabled} onClick={() => editor.chain().focus().deleteColumn().run()} />
      <TableTextButton icon={Trash2} label="Delete table" disabled={disabled} onClick={() => editor.chain().focus().deleteTable().run()} />
    </div>
  );
}

function TableTextButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      disabled={disabled}
      onClick={onClick}
      className="text-muted-foreground hover:bg-background hover:text-foreground"
    >
      <Icon aria-hidden="true" />
      {label}
    </Button>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            active && "bg-accent text-accent-foreground hover:bg-accent"
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarSeparator() {
  return <Separator orientation="vertical" className="mx-1 h-5" />;
}

function LinkControl({ editor, isActive, disabled }: { editor: Editor; isActive: boolean; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [newTab, setNewTab] = useState(true);
  const [touched, setTouched] = useState(false);

  const invalid = touched && url.trim() !== "" && !isSafeUrl(url);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          const attrs = editor.getAttributes("link");
          setUrl(typeof attrs.href === "string" ? attrs.href : "");
          // For an existing link, reflect its actual target; for a brand
          // new one (no href yet) default to checked — the common case for
          // content-writer links pointing off-site.
          setNewTab(typeof attrs.href === "string" ? attrs.target === "_blank" : true);
          setTouched(false);
        }
      }}
    >
      <PopoverTrigger asChild>
        <span>
          <ToolbarButton icon={Link2} label="Link" active={isActive} disabled={disabled} onClick={() => setOpen(true)} />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <p className="text-label text-foreground">{isActive ? "Edit link" : "Insert link"}</p>
        <Input
          placeholder="https://example.com"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setTouched(true);
          }}
          aria-invalid={invalid || undefined}
          autoFocus
        />
        {invalid && <p className="text-error">Enter a valid, safe URL.</p>}
        <label className="flex items-center gap-2 text-body-sm text-foreground">
          <input
            type="checkbox"
            checked={newTab}
            onChange={(event) => setNewTab(event.target.checked)}
            className="size-3.5 rounded-sm border-input accent-primary"
          />
          Open in new tab
        </label>
        <div className="flex justify-end gap-1.5 pt-1">
          {isActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                setOpen(false);
              }}
            >
              Remove
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={!url.trim() || !isSafeUrl(url)}
            onClick={() => {
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({
                  href: url.trim(),
                  target: newTab ? "_blank" : null,
                  rel: newTab ? "noopener noreferrer nofollow" : "nofollow",
                })
                .run();
              setOpen(false);
            }}
          >
            {isActive ? "Update" : "Insert"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ImageControl({ editor, isActive, disabled }: { editor: Editor; isActive: boolean; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [align, setAlign] = useState<"left" | "center" | "right">("center");
  const [touched, setTouched] = useState(false);

  const invalid = touched && src.trim() !== "" && !isSafeUrl(src);
  const previewSrc = useMemo(() => (src.trim() && isSafeUrl(src) ? src.trim() : null), [src]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          const attrs = editor.getAttributes("image");
          setSrc(typeof attrs.src === "string" ? attrs.src : "");
          setAlt(typeof attrs.alt === "string" ? attrs.alt : "");
          setAlign(attrs.align === "left" || attrs.align === "right" ? attrs.align : "center");
          setTouched(false);
        }
      }}
    >
      <PopoverTrigger asChild>
        <span>
          <ToolbarButton icon={ImageIcon} label="Image" active={isActive} disabled={disabled} onClick={() => setOpen(true)} />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <p className="text-label text-foreground">{isActive ? "Edit image" : "Insert image"}</p>
        <p className="text-helper">
          Paste the URL of an already-hosted image — direct file upload isn&apos;t available for this field yet.
        </p>
        <Input
          placeholder="https://example.com/photo.jpg"
          value={src}
          onChange={(event) => {
            setSrc(event.target.value);
            setTouched(true);
          }}
          aria-invalid={invalid || undefined}
          autoFocus
        />
        {invalid && <p className="text-error">Enter a valid, safe image URL.</p>}
        {previewSrc && (
          // eslint-disable-next-line @next/next/no-img-element -- transient preview of a user-supplied external URL inside a popover, not an app asset.
          <img
            src={previewSrc}
            alt=""
            className="max-h-32 w-full rounded-md border border-border object-contain"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
        <Input placeholder="Alt text (optional)" value={alt} onChange={(event) => setAlt(event.target.value)} />
        <div className="flex items-center gap-1">
          <span className="text-helper">Align:</span>
          {(["left", "center", "right"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={align === value ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setAlign(value)}
              className="capitalize"
            >
              {value}
            </Button>
          ))}
        </div>
        <div className="flex justify-end gap-1.5 pt-1">
          {isActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                editor.chain().focus().deleteSelection().run();
                setOpen(false);
              }}
            >
              Remove
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={!src.trim() || !isSafeUrl(src)}
            onClick={() => {
              if (isActive) {
                editor.chain().focus().updateAttributes("image", { src: src.trim(), alt: alt || null, align }).run();
              } else {
                editor.chain().focus().setImage({ src: src.trim(), alt: alt || undefined, align } as never).run();
              }
              setOpen(false);
            }}
          >
            {isActive ? "Update" : "Insert"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
