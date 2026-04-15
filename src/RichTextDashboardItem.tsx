import { useCallback, useEffect, useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import type {
  ChangeEvent,
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import type { DraggableGridItem } from './drag-and-droppable-grid/types';

type RichTextDashboardItemProps = {
  item: DraggableGridItem;
  canEdit: boolean;
  isSingleRowCard: boolean;
  onItemChanged?: (
    itemId: string,
    updates: Partial<Omit<DraggableGridItem, 'id'>>
  ) => void;
};

const richTextCommands = [
  {
    id: 'bold',
    label: 'B',
    command: 'bold',
    title: 'Bold',
    fontStyle: 'normal',
    fontWeight: 900,
  },
  {
    id: 'italic',
    label: 'I',
    command: 'italic',
    title: 'Italic',
    fontStyle: 'italic',
    fontWeight: 800,
  },
  {
    id: 'underline',
    label: 'U',
    command: 'underline',
    title: 'Underline',
    fontStyle: 'normal',
    fontWeight: 800,
  },
  {
    id: 'strike',
    label: 'S',
    command: 'strikeThrough',
    title: 'Strikethrough',
    fontStyle: 'normal',
    fontWeight: 800,
    textDecoration: 'line-through',
  },
  {
    id: 'subscript',
    label: 'x2',
    command: 'subscript',
    title: 'Subscript',
    fontStyle: 'normal',
    fontWeight: 800,
  },
  {
    id: 'superscript',
    label: 'x2',
    command: 'superscript',
    title: 'Superscript',
    fontStyle: 'normal',
    fontWeight: 800,
  },
];

const listCommands = [
  {
    id: 'list',
    label: 'Bullets',
    command: 'insertUnorderedList',
    title: 'Bulleted list',
  },
  {
    id: 'numbered-list',
    label: 'Numbers',
    command: 'insertOrderedList',
    title: 'Numbered list',
  },
  {
    id: 'outdent',
    label: 'Outdent',
    command: 'outdent',
    title: 'Outdent',
  },
  {
    id: 'indent',
    label: 'Indent',
    command: 'indent',
    title: 'Indent',
  },
];

const allowedRichTextTags = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'sub',
  'sup',
  'u',
  'ul',
]);

const blockFormatOptions = [
  { label: 'Paragraph', value: 'p' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
  { label: 'Quote', value: 'blockquote' },
  { label: 'Code block', value: 'pre' },
];

const fontFamilyOptions = [
  { label: 'Default font', value: '' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Sans', value: 'Aptos, Calibri, sans-serif' },
  { label: 'Mono', value: '"SFMono-Regular", Consolas, monospace' },
  { label: 'Display', value: '"Trebuchet MS", sans-serif' },
];

const fontSizeOptions = [
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '32', value: '32px' },
];

const lineHeightOptions = [
  { label: '1.0', value: '1' },
  { label: '1.25', value: '1.25' },
  { label: '1.5', value: '1.5' },
  { label: '1.75', value: '1.75' },
  { label: '2.0', value: '2' },
];

const textAlignmentCommands = [
  { id: 'align-left', label: 'Left', command: 'justifyLeft' },
  { id: 'align-center', label: 'Center', command: 'justifyCenter' },
  { id: 'align-right', label: 'Right', command: 'justifyRight' },
  { id: 'align-justify', label: 'Justify', command: 'justifyFull' },
];

const textColorOptions = ['#111827', '#4338ca', '#b91c1c', '#15803d'];
const highlightColorOptions = ['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3'];

export function RichTextDashboardItem(
  props: RichTextDashboardItemProps
): React.JSX.Element {
  const { item, canEdit, isSingleRowCard, onItemChanged } = props;
  const editorRef = useRef<HTMLDivElement | null>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const latestItemRef = useRef({
    body: item.body,
    id: item.id,
    onItemChanged,
  });
  const initialHtml = sanitizeRichTextHtml(item.body);

  useEffect(() => {
    latestItemRef.current = {
      body: item.body,
      id: item.id,
      onItemChanged,
    };
  }, [item.body, item.id, onItemChanged]);

  useEffect(() => {
    const editorElement = editorRef.current;

    if (!editorElement || document.activeElement === editorElement) {
      return;
    }

    if (editorElement.innerHTML !== initialHtml) {
      editorElement.innerHTML = initialHtml;
    }
  }, [initialHtml, item.id]);

  const rememberEditorSelection = useCallback(() => {
    const editorElement = editorRef.current;
    const selection = window.getSelection();

    if (
      !editorElement ||
      !selection ||
      selection.rangeCount === 0 ||
      !selection.anchorNode ||
      !editorElement.contains(selection.anchorNode)
    ) {
      return;
    }

    selectionRangeRef.current = selection.getRangeAt(0).cloneRange();
  }, []);

  const restoreEditorSelection = useCallback(() => {
    const editorElement = editorRef.current;
    const selection = window.getSelection();
    const selectionRange = selectionRangeRef.current;

    editorElement?.focus();

    if (!editorElement || !selection || !selectionRange) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(selectionRange);
  }, []);

  const commitEditorHtml = useCallback(() => {
    const editorElement = editorRef.current;

    if (!editorElement) {
      return;
    }

    const latestItem = latestItemRef.current;
    const nextHtml = sanitizeRichTextHtml(editorElement.innerHTML);
    const previousHtml = sanitizeRichTextHtml(latestItem.body);

    if (editorElement.innerHTML !== nextHtml) {
      editorElement.innerHTML = nextHtml;
    }

    if (nextHtml !== previousHtml) {
      latestItem.onItemChanged?.(latestItem.id, { body: nextHtml });
    }
  }, []);

  useEffect(() => {
    return () => {
      commitEditorHtml();
    };
  }, [commitEditorHtml]);

  const runEditorCommand = useCallback(
    (command: string, value?: string, shouldCommit = false) => {
      restoreEditorSelection();
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand(command, false, value);
      normalizeEditorFontTags(editorRef.current);
      rememberEditorSelection();

      if (shouldCommit) {
        commitEditorHtml();
      }
    },
    [commitEditorHtml, rememberEditorSelection, restoreEditorSelection]
  );

  const handleEditorDragStart = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  const handleToolbarButtonMouseDown = useCallback(
    (
      event:
        | ReactMouseEvent<HTMLButtonElement>
    ) => {
      // Keep focus in the editable surface so execCommand applies to the
      // current selection instead of collapsing it when the toolbar is clicked.
      rememberEditorSelection();
      event.preventDefault();
      event.stopPropagation();
    },
    [rememberEditorSelection]
  );

  const handleToolbarControlMouseDown = useCallback(
    (
      event:
        | ReactMouseEvent<HTMLSelectElement>
        | ReactMouseEvent<HTMLInputElement>
    ) => {
      rememberEditorSelection();
      event.stopPropagation();
    },
    [rememberEditorSelection]
  );

  const handleToolbarCommand = useCallback(
    (command: string) => {
      runEditorCommand(command);
    },
    [runEditorCommand]
  );

  const handleBlockFormatChanged = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      runEditorCommand('formatBlock', event.currentTarget.value, true);
    },
    [runEditorCommand]
  );

  const handleFontFamilyChanged = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const fontFamily = event.currentTarget.value;

      if (!fontFamily) {
        applyInlineStyleToSelection({
          editorElement: editorRef.current,
          restoreEditorSelection,
          styleName: 'fontFamily',
          styleValue: '',
        });
        commitEditorHtml();
        return;
      }

      runEditorCommand('fontName', fontFamily, true);
    },
    [commitEditorHtml, restoreEditorSelection, runEditorCommand]
  );

  const handleFontSizeChanged = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      restoreEditorSelection();
      document.execCommand('styleWithCSS', false, 'false');
      document.execCommand('fontSize', false, '7');
      applyFontSizeToBrowserFontTags(editorRef.current, event.currentTarget.value);
      rememberEditorSelection();
      commitEditorHtml();
    },
    [commitEditorHtml, rememberEditorSelection, restoreEditorSelection]
  );

  const handleLineHeightChanged = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      applyBlockStyleToSelection({
        editorElement: editorRef.current,
        restoreEditorSelection,
        styleName: 'lineHeight',
        styleValue: event.currentTarget.value,
      });
      commitEditorHtml();
    },
    [commitEditorHtml, restoreEditorSelection]
  );

  const handleTextColorSelected = useCallback(
    (color: string) => {
      runEditorCommand('foreColor', color, true);
    },
    [runEditorCommand]
  );

  const handleHighlightColorSelected = useCallback(
    (color: string) => {
      restoreEditorSelection();
      document.execCommand('styleWithCSS', false, 'true');

      // Browser support differs here: Chromium supports hiliteColor, while
      // older/contenteditable paths may only respond to backColor.
      if (!document.execCommand('hiliteColor', false, color)) {
        document.execCommand('backColor', false, color);
      }

      rememberEditorSelection();
      commitEditorHtml();
    },
    [commitEditorHtml, rememberEditorSelection, restoreEditorSelection]
  );

  const handleLinkClicked = useCallback(() => {
    const href = window.prompt('Enter a URL for this link');
    const normalizedHref = normalizeEditorHref(href);

    if (href === null) {
      return;
    }

    if (!normalizedHref) {
      runEditorCommand('unlink', undefined, true);
      return;
    }

    runEditorCommand('createLink', normalizedHref, true);
  }, [runEditorCommand]);

  if (!canEdit) {
    return (
      <RichTextViewer html={initialHtml} isSingleRowCard={isSingleRowCard} />
    );
  }

  return (
    <Box
      data-draggable-grid-no-drag="true"
      data-draggable-grid-no-undo="true"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        gap: 0.75,
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <Box
        aria-label="Rich text formatting"
        role="toolbar"
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
          minWidth: 0,
        }}
      >
        <ToolbarSelect
          ariaLabel="Text style"
          defaultValue="p"
          onChange={handleBlockFormatChanged}
          onMouseDown={handleToolbarControlMouseDown}
          options={blockFormatOptions}
          width={112}
        />
        <ToolbarSelect
          ariaLabel="Font family"
          defaultValue=""
          onChange={handleFontFamilyChanged}
          onMouseDown={handleToolbarControlMouseDown}
          options={fontFamilyOptions}
          width={112}
        />
        <ToolbarSelect
          ariaLabel="Font size"
          defaultValue="14px"
          onChange={handleFontSizeChanged}
          onMouseDown={handleToolbarControlMouseDown}
          options={fontSizeOptions}
          width={64}
        />
        <ToolbarSelect
          ariaLabel="Line height"
          defaultValue="1.5"
          onChange={handleLineHeightChanged}
          onMouseDown={handleToolbarControlMouseDown}
          options={lineHeightOptions}
          width={68}
        />
        {richTextCommands.map((richTextCommand) => (
          <Button
            key={richTextCommand.id}
            type="button"
            size="small"
            variant="outlined"
            title={richTextCommand.title}
            onMouseDown={handleToolbarButtonMouseDown}
            onClick={() => {
              handleToolbarCommand(richTextCommand.command);
            }}
            sx={{
              minWidth: 28,
              height: 26,
              borderRadius: 1.5,
              borderColor: 'rgba(67, 56, 202, 0.18)',
              color: '#4338ca',
              fontSize: '0.72rem',
              fontStyle: richTextCommand.fontStyle,
              fontWeight: richTextCommand.fontWeight,
              lineHeight: 1,
              px: 0.5,
              textDecoration: richTextCommand.textDecoration,
              textTransform: 'none',
              '& sup': {
                fontSize: '0.6em',
              },
              '& sub': {
                fontSize: '0.6em',
              },
            }}
          >
            {richTextCommand.id === 'superscript' ? (
              <>
                x<sup>2</sup>
              </>
            ) : richTextCommand.id === 'subscript' ? (
              <>
                x<sub>2</sub>
              </>
            ) : (
              richTextCommand.label
            )}
          </Button>
        ))}
        {listCommands.map((listCommand) => (
          <ToolbarButton
            key={listCommand.id}
            label={listCommand.label}
            title={listCommand.title}
            onMouseDown={handleToolbarButtonMouseDown}
            onClick={() => {
              handleToolbarCommand(listCommand.command);
            }}
          />
        ))}
        {textAlignmentCommands.map((alignmentCommand) => (
          <ToolbarButton
            key={alignmentCommand.id}
            label={alignmentCommand.label}
            title={alignmentCommand.label}
            onMouseDown={handleToolbarButtonMouseDown}
            onClick={() => {
              handleToolbarCommand(alignmentCommand.command);
            }}
          />
        ))}
        <ColorToolbarControl
          ariaLabel="Text color"
          colors={textColorOptions}
          onMouseDown={handleToolbarButtonMouseDown}
          onSelectColor={handleTextColorSelected}
          title="Text color"
        />
        <ColorToolbarControl
          ariaLabel="Highlight color"
          colors={highlightColorOptions}
          onMouseDown={handleToolbarButtonMouseDown}
          onSelectColor={handleHighlightColorSelected}
          title="Highlight"
        />
        <ToolbarButton
          label="Link"
          title="Add link"
          onMouseDown={handleToolbarButtonMouseDown}
          onClick={handleLinkClicked}
        />
        <ToolbarButton
          label="Unlink"
          title="Remove link"
          onMouseDown={handleToolbarButtonMouseDown}
          onClick={() => {
            handleToolbarCommand('unlink');
          }}
        />
        <ToolbarButton
          label="Clear"
          title="Clear formatting"
          onMouseDown={handleToolbarButtonMouseDown}
          onClick={() => {
            runEditorCommand('removeFormat', undefined, true);
          }}
        />
      </Box>

      <Box
        ref={editorRef}
        aria-label={`${item.title ?? 'Rich text'} editor`}
        contentEditable
        dangerouslySetInnerHTML={{ __html: initialHtml }}
        draggable={false}
        role="textbox"
        suppressContentEditableWarning
        tabIndex={0}
        onBlur={commitEditorHtml}
        onDragStart={handleEditorDragStart}
        onInput={rememberEditorSelection}
        onKeyUp={rememberEditorSelection}
        onMouseUp={rememberEditorSelection}
        sx={{
          ...richTextContentSx,
          flex: 1,
          minHeight: isSingleRowCard ? 32 : 68,
          maxHeight: '100%',
          overflowY: 'auto',
          border: '1px solid rgba(67, 56, 202, 0.18)',
          borderRadius: 1.5,
          bgcolor: 'rgba(99, 102, 241, 0.05)',
          cursor: 'text',
          outline: 'none',
          px: 1,
          py: 0.8,
          userSelect: 'text',
          '&:focus': {
            borderColor: 'rgba(67, 56, 202, 0.5)',
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.12)',
          },
        }}
      />
    </Box>
  );
}

function RichTextViewer({
  html,
  isSingleRowCard,
}: {
  html: string;
  isSingleRowCard: boolean;
}) {
  const hasContent = getRichTextPlainText(html).trim().length > 0;

  if (!hasContent) {
    return (
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: '0.78rem',
          fontStyle: 'italic',
          fontWeight: 600,
          lineHeight: 1.35,
        }}
      >
        No notes yet.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        ...richTextContentSx,
        maxHeight: isSingleRowCard ? '1.5rem' : '100%',
        overflow: 'hidden',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

type ToolbarSelectProps = {
  ariaLabel: string;
  defaultValue: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onMouseDown: (event: ReactMouseEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string }[];
  width: number;
};

function ToolbarSelect({
  ariaLabel,
  defaultValue,
  onChange,
  onMouseDown,
  options,
  width,
}: ToolbarSelectProps) {
  return (
    <Box
      component="select"
      aria-label={ariaLabel}
      defaultValue={defaultValue}
      onChange={onChange}
      onMouseDown={onMouseDown}
      sx={{
        width,
        height: 26,
        border: '1px solid rgba(67, 56, 202, 0.18)',
        borderRadius: 1.5,
        bgcolor: '#ffffff',
        color: '#312e81',
        cursor: 'pointer',
        fontSize: '0.72rem',
        fontWeight: 800,
        outline: 'none',
        px: 0.75,
      }}
    >
      {options.map((option) => (
        <option key={option.value || option.label} value={option.value}>
          {option.label}
        </option>
      ))}
    </Box>
  );
}

type ToolbarButtonProps = {
  label: string;
  title: string;
  onClick: () => void;
  onMouseDown: (event: ReactMouseEvent<HTMLButtonElement>) => void;
};

function ToolbarButton({
  label,
  title,
  onClick,
  onMouseDown,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="small"
      variant="outlined"
      title={title}
      onClick={onClick}
      onMouseDown={onMouseDown}
      sx={{
        minWidth: 28,
        height: 26,
        borderRadius: 1.5,
        borderColor: 'rgba(67, 56, 202, 0.18)',
        color: '#4338ca',
        fontSize: '0.68rem',
        fontWeight: 800,
        lineHeight: 1,
        px: 0.8,
        textTransform: 'none',
      }}
    >
      {label}
    </Button>
  );
}

type ColorToolbarControlProps = {
  ariaLabel: string;
  colors: string[];
  onMouseDown: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onSelectColor: (color: string) => void;
  title: string;
};

function ColorToolbarControl({
  ariaLabel,
  colors,
  onMouseDown,
  onSelectColor,
  title,
}: ColorToolbarControlProps) {
  const handleCustomColorClick = useCallback(() => {
    const color = window.prompt(`${title} hex color`, colors[0]);

    if (!color) {
      return;
    }

    if (!isSafeColorValue(color)) {
      return;
    }

    onSelectColor(color);
  }, [colors, onSelectColor, title]);

  return (
    <Box
      aria-label={ariaLabel}
      role="group"
      title={title}
      sx={{
        alignItems: 'center',
        border: '1px solid rgba(67, 56, 202, 0.18)',
        borderRadius: 1.5,
        display: 'inline-flex',
        gap: 0.5,
        height: 26,
        px: 0.6,
      }}
    >
      <Typography
        component="span"
        sx={{
          color: '#4338ca',
          fontSize: '0.64rem',
          fontWeight: 900,
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Typography>
      {colors.map((color) => (
        <Box
          key={color}
          component="button"
          aria-label={`${title} ${color}`}
          type="button"
          onClick={() => {
            onSelectColor(color);
          }}
          onMouseDown={onMouseDown}
          sx={{
            width: 16,
            height: 16,
            border: '1px solid rgba(15, 23, 42, 0.22)',
            borderRadius: 999,
            bgcolor: color,
            cursor: 'pointer',
            p: 0,
          }}
        />
      ))}
      <Box
        component="button"
        aria-label={`Custom ${title.toLowerCase()}`}
        type="button"
        onClick={handleCustomColorClick}
        onMouseDown={onMouseDown}
        sx={{
          width: 20,
          height: 18,
          border: '1px dashed rgba(67, 56, 202, 0.35)',
          borderRadius: 1,
          bgcolor: '#ffffff',
          color: '#4338ca',
          cursor: 'pointer',
          fontSize: '0.68rem',
          fontWeight: 900,
          lineHeight: '16px',
          p: 0,
        }}
      >
        +
      </Box>
    </Box>
  );
}

const richTextContentSx = {
  color: 'text.secondary',
  fontSize: '0.78rem',
  fontWeight: 600,
  lineHeight: 1.35,
  minWidth: 0,
  overflowWrap: 'anywhere',
  '& a': {
    color: 'primary.main',
    fontWeight: 800,
    textDecoration: 'none',
  },
  '& a:hover': {
    textDecoration: 'underline',
  },
  '& blockquote': {
    borderLeft: '3px solid rgba(67, 56, 202, 0.22)',
    color: 'text.secondary',
    m: 0,
    my: 0.75,
    pl: 1,
  },
  '& code': {
    bgcolor: 'rgba(15, 23, 42, 0.06)',
    borderRadius: 0.75,
    color: 'text.primary',
    fontFamily:
      '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '0.92em',
    px: 0.5,
  },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    color: 'text.primary',
    fontWeight: 850,
    letterSpacing: '-0.02em',
    lineHeight: 1.08,
    m: 0,
    mb: 0.75,
  },
  '& h1': {
    fontSize: '1.75em',
  },
  '& h2': {
    fontSize: '1.45em',
  },
  '& h3': {
    fontSize: '1.25em',
  },
  '& p': {
    m: 0,
    mb: 0.75,
  },
  '& p:last-child': {
    mb: 0,
  },
  '& strong, & b': {
    color: 'text.primary',
    fontWeight: 850,
  },
  '& ul, & ol': {
    m: 0,
    my: 0.5,
    pl: 2.5,
  },
  '& li': {
    mb: 0.25,
  },
  '& li:last-child': {
    mb: 0,
  },
  '& pre': {
    bgcolor: 'rgba(15, 23, 42, 0.06)',
    borderRadius: 1.5,
    color: 'text.primary',
    fontFamily:
      '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '0.9em',
    m: 0,
    my: 0.5,
    overflowX: 'auto',
    p: 1,
    whiteSpace: 'pre-wrap',
  },
  '& span': {
    fontSize: 'inherit',
  },
  '& sub, & sup': {
    fontSize: '0.72em',
    lineHeight: 0,
  },
} as const;

function sanitizeRichTextHtml(value?: string): string {
  const html = normalizeRichTextInput(value);

  if (typeof document === 'undefined') {
    return html;
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  sanitizeRichTextNode(template.content);

  return template.innerHTML.trim() || '<p><br></p>';
}

function sanitizeRichTextNode(parentNode: ParentNode): void {
  Array.from(parentNode.childNodes).forEach((childNode) => {
    if (childNode.nodeType === 3) {
      return;
    }

    if (childNode.nodeType !== 1) {
      childNode.remove();
      return;
    }

    let element = childNode as HTMLElement;
    let tagName = element.tagName.toLowerCase();

    sanitizeRichTextNode(element);

    if (tagName === 'font') {
      element = replaceFontElementWithSpan(element);
      tagName = element.tagName.toLowerCase();
    }

    if (!allowedRichTextTags.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    const href = element.getAttribute('href') ?? '';
    const sanitizedStyle = getSanitizedRichTextStyle(element);

    Array.from(element.attributes).forEach((attribute) => {
      element.removeAttribute(attribute.name);
    });

    if (sanitizedStyle) {
      element.setAttribute('style', sanitizedStyle);
    }

    if (tagName === 'span' && !element.getAttribute('style')) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    if (tagName !== 'a' || !isSafeRichTextHref(href)) {
      return;
    }

    element.setAttribute('href', href);
    element.setAttribute('rel', 'noreferrer');
    element.setAttribute('target', '_blank');
  });
}

function normalizeEditorFontTags(editorElement: HTMLElement | null): void {
  if (!editorElement) {
    return;
  }

  Array.from(editorElement.querySelectorAll('font')).forEach((fontElement) => {
    replaceFontElementWithSpan(fontElement as HTMLElement);
  });
}

function applyFontSizeToBrowserFontTags(
  editorElement: HTMLElement | null,
  fontSize: string
): void {
  if (!editorElement || !isSafeLengthValue(fontSize)) {
    return;
  }

  Array.from(editorElement.querySelectorAll('font[size="7"]')).forEach(
    (fontElement) => {
      (fontElement as HTMLElement).style.fontSize = fontSize;
    }
  );

  normalizeEditorFontTags(editorElement);
}

function replaceFontElementWithSpan(fontElement: HTMLElement): HTMLElement {
  const spanElement = document.createElement('span');
  const fontFace = fontElement.getAttribute('face') ?? '';
  const fontColor = fontElement.getAttribute('color') ?? '';
  const browserFontSize = fontElement.getAttribute('size') ?? '';
  const sanitizedStyle = getSanitizedRichTextStyle(fontElement);

  if (sanitizedStyle) {
    spanElement.setAttribute('style', sanitizedStyle);
  }

  if (isSafeFontFamilyValue(fontFace)) {
    spanElement.style.fontFamily = fontFace;
  }

  if (isSafeColorValue(fontColor)) {
    spanElement.style.color = fontColor;
  }

  const mappedFontSize = getBrowserFontSizeValue(browserFontSize);

  if (mappedFontSize && !spanElement.style.fontSize) {
    spanElement.style.fontSize = mappedFontSize;
  }

  Array.from(fontElement.childNodes).forEach((childNode) => {
    spanElement.appendChild(childNode);
  });
  fontElement.replaceWith(spanElement);

  return spanElement;
}

function applyInlineStyleToSelection({
  editorElement,
  restoreEditorSelection,
  styleName,
  styleValue,
}: {
  editorElement: HTMLElement | null;
  restoreEditorSelection: () => void;
  styleName: 'fontFamily';
  styleValue: string;
}): void {
  if (!editorElement) {
    return;
  }

  restoreEditorSelection();

  if (styleName === 'fontFamily' && styleValue === '') {
    editorElement.querySelectorAll('span').forEach((spanElement) => {
      (spanElement as HTMLElement).style.fontFamily = '';
    });
  }
}

function applyBlockStyleToSelection({
  editorElement,
  restoreEditorSelection,
  styleName,
  styleValue,
}: {
  editorElement: HTMLElement | null;
  restoreEditorSelection: () => void;
  styleName: 'lineHeight';
  styleValue: string;
}): void {
  if (!editorElement) {
    return;
  }

  restoreEditorSelection();

  const selection = window.getSelection();
  const anchorNode = selection?.anchorNode ?? null;
  const blockElement = getEditableBlockElement(anchorNode, editorElement);

  if (!blockElement || styleName !== 'lineHeight') {
    return;
  }

  blockElement.style.lineHeight = styleValue;
}

function getEditableBlockElement(
  node: Node | null,
  editorElement: HTMLElement
): HTMLElement | null {
  if (!node) {
    return editorElement;
  }

  const element =
    node.nodeType === 1 ? (node as HTMLElement) : node.parentElement;
  const blockElement = element?.closest(
    'p, div, h1, h2, h3, h4, h5, h6, blockquote, pre, li'
  );

  if (blockElement instanceof HTMLElement && editorElement.contains(blockElement)) {
    return blockElement;
  }

  return editorElement;
}

function normalizeEditorHref(href: string | null): string | null {
  if (href === null) {
    return null;
  }

  const trimmedHref = href.trim();

  if (!trimmedHref) {
    return '';
  }

  if (isSafeRichTextHref(trimmedHref)) {
    return trimmedHref;
  }

  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmedHref)) {
    return `https://${trimmedHref}`;
  }

  return '';
}

function getSanitizedRichTextStyle(element: HTMLElement): string {
  const allowedStyleProperties = [
    'background-color',
    'color',
    'font-family',
    'font-size',
    'font-style',
    'font-weight',
    'line-height',
    'text-align',
    'text-decoration',
    'text-decoration-line',
    'vertical-align',
  ];
  const sanitizedStyles = allowedStyleProperties.flatMap((styleProperty) => {
    const styleValue = element.style.getPropertyValue(styleProperty).trim();

    if (!styleValue || !isSafeStyleValue(styleProperty, styleValue)) {
      return [];
    }

    return [`${styleProperty}: ${styleValue}`];
  });

  return sanitizedStyles.join('; ');
}

function isSafeStyleValue(styleProperty: string, styleValue: string): boolean {
  if (/expression\s*\(|javascript:|url\s*\(/i.test(styleValue)) {
    return false;
  }

  if (styleProperty === 'color' || styleProperty === 'background-color') {
    return isSafeColorValue(styleValue);
  }

  if (styleProperty === 'font-family') {
    return isSafeFontFamilyValue(styleValue);
  }

  if (styleProperty === 'font-size') {
    return isSafeLengthValue(styleValue);
  }

  if (styleProperty === 'line-height') {
    return /^(\d+(\.\d+)?|\d+(\.\d+)?(px|rem|em|%))$/i.test(styleValue);
  }

  if (styleProperty === 'font-style') {
    return /^(normal|italic|oblique)$/i.test(styleValue);
  }

  if (styleProperty === 'font-weight') {
    return /^(normal|bold|bolder|lighter|[1-9]00)$/i.test(styleValue);
  }

  if (styleProperty === 'text-align') {
    return /^(left|center|right|justify|start|end)$/i.test(styleValue);
  }

  if (
    styleProperty === 'text-decoration' ||
    styleProperty === 'text-decoration-line'
  ) {
    return /^(none|underline|line-through|overline|\s)+$/i.test(styleValue);
  }

  if (styleProperty === 'vertical-align') {
    return /^(baseline|sub|super|text-bottom|text-top)$/i.test(styleValue);
  }

  return false;
}

function isSafeColorValue(colorValue: string): boolean {
  if (!colorValue) {
    return false;
  }

  if (/^#[0-9a-f]{3,8}$/i.test(colorValue)) {
    return true;
  }

  if (typeof CSS !== 'undefined' && CSS.supports('color', colorValue)) {
    return true;
  }

  return false;
}

function isSafeFontFamilyValue(fontFamilyValue: string): boolean {
  return /^[\w\s"',.-]+$/.test(fontFamilyValue);
}

function isSafeLengthValue(lengthValue: string): boolean {
  return /^(\d+(\.\d+)?)(px|rem|em|%)$/i.test(lengthValue);
}

function getBrowserFontSizeValue(browserFontSize: string): string | null {
  const fontSizeMap: Record<string, string> = {
    '1': '10px',
    '2': '13px',
    '3': '16px',
    '4': '18px',
    '5': '24px',
    '6': '32px',
    '7': '48px',
  };

  return fontSizeMap[browserFontSize] ?? null;
}

function normalizeRichTextInput(value?: string): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return '<p><br></p>';
  }

  if (/<\/?[a-z][\s\S]*>/i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `<p>${escapeHtml(trimmedValue)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')}</p>`;
}

function getRichTextPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  return template.content.textContent ?? '';
}

function isSafeRichTextHref(href: string): boolean {
  return /^(https?:|mailto:|tel:|#|\/)/i.test(href);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const escapedCharacters: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return escapedCharacters[character] ?? character;
  });
}
