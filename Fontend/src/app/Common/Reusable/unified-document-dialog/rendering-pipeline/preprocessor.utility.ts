/**
 * PdfPreprocessor Utility
 * 
 * Responsible for normalizing HTML content for A4 PDF generation.
 * Handles sanitization, removing unsupported CSS, and ensuring A4 layout consistency.
 */
export class PdfPreprocessor {
  private static readonly A4_WIDTH_MM = 210;
  private static readonly UNSUPPORTED_STYLES = [
    'position: fixed',
    'position: sticky',
    'vh',
    'vw',
    'calc(.*vh)',
    'calc(.*vw)'
  ];

  /**
   * Preprocesses an Element to be PDF-safe.
   * @param element The HTML element to normalize.
   */
  public static normalize(element: HTMLElement): void {
    this.stripUnsupportedStyles(element);
    this.applyA4Constraints(element);
    this.normalizeImages(element);
    this.fixTables(element);
  }

  /**
   * Removes or transforms CSS that causes issues in html2canvas/jsPDF.
   */
  private static stripUnsupportedStyles(root: HTMLElement): void {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode() as HTMLElement;

    while (node) {
      if (!(node instanceof HTMLElement)) {
        node = walker.nextNode() as HTMLElement;
        continue;
      }

      const style = window.getComputedStyle(node);

      // Convert position: fixed/sticky to static
      if (style.position === 'fixed' || style.position === 'sticky') {
        node.style.position = 'static';
      }

      // Handle overflow issues
      if (style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden') {
        node.style.overflow = 'visible';
      }

      // Transform vh/vw to approximate px/percentage (simplified)
      if (node.style.height?.includes('vh')) node.style.height = 'auto';
      if (node.style.width?.includes('vw')) node.style.width = '100%';

      // Ensure background color is preserved if it's white or transparent-to-white
      if (style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent') {
        // html2canvas handles this via configuration, but explicit white can help in some cases
      }

      node = walker.nextNode() as HTMLElement;
    }
  }

  /**
   * Enforces strict A4 width and box-sizing.
   */
  private static applyA4Constraints(element: HTMLElement): void {
    element.style.width = `${this.A4_WIDTH_MM}mm`;
    element.style.minWidth = `${this.A4_WIDTH_MM}mm`;
    element.style.maxWidth = `${this.A4_WIDTH_MM}mm`;
    element.style.boxSizing = 'border-box';
    element.style.backgroundColor = '#ffffff';
    element.style.margin = '0';
    element.style.padding = '0';
  }

  /**
   * Normalizes images for consistent rendering.
   */
  private static normalizeImages(root: HTMLElement): void {
    const images = root.querySelectorAll('img');
    images.forEach(img => {
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      // Ensure no CSS transforms disrupt image placement
      img.style.transform = 'none';
      img.setAttribute('crossorigin', 'anonymous');
    });
  }

  /**
   * Fixes common table rendering issues in PDF generators.
   */
  private static fixTables(root: HTMLElement): void {
    const tables = root.querySelectorAll('table');
    tables.forEach(table => {
      table.style.width = '100%';
      table.style.tableLayout = 'fixed';
      table.style.borderCollapse = 'collapse';
      // Prevent tables from being cut off if possible (better handled by chunking engine)
    });
  }
}
