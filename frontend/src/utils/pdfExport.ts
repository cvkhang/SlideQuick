import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Project, SlideElement } from "../types";

export async function exportToPDF(project: Project) {
  // Use 1920x1080 (Full HD) for high quality PDF
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1920, 1080],
  });

  const SCALE_FACTOR = 2; // Editor is 960x540, PDF gen is 1920x1080

  for (let i = 0; i < project.slides.length; i++) {
    const slide = project.slides[i];

    // Create a temporary div to render the slide
    const slideDiv = document.createElement("div");
    slideDiv.style.width = "1920px";
    slideDiv.style.height = "1080px";
    slideDiv.style.backgroundColor = slide.backgroundColor || "#ffffff";
    slideDiv.style.position = "absolute";
    slideDiv.style.left = "-9999px";
    slideDiv.style.top = "0";
    slideDiv.style.overflow = "hidden"; // Clip content outside
    slideDiv.style.fontFamily = "Arial, sans-serif";

    // Standardize elements list
    const elements = slide.elements || [];

    // Render Elements
    elements.forEach((el: SlideElement) => {
      const elDiv = document.createElement("div");

      // Common positioning
      elDiv.style.position = "absolute";
      elDiv.style.left = `${el.x * SCALE_FACTOR}px`;
      elDiv.style.top = `${el.y * SCALE_FACTOR}px`;
      elDiv.style.width = `${el.width * SCALE_FACTOR}px`;
      elDiv.style.height = `${el.height * SCALE_FACTOR}px`;
      elDiv.style.boxSizing = "border-box";
      elDiv.style.zIndex = el.style?.zIndex ? String(el.style.zIndex) : "auto";

      // Apply styles
      if (el.style) {
        elDiv.style.opacity = el.style.opacity ? String(el.style.opacity) : "1";
        if (el.style.border) elDiv.style.border = el.style.border;
        if (el.style.borderRadius) {
          // Scale border radius if it's a number, or just pass string
          const br = typeof el.style.borderRadius === 'number'
            ? `${el.style.borderRadius * SCALE_FACTOR}px`
            : el.style.borderRadius;
          elDiv.style.borderRadius = String(br);
        }
      }

      // Render content based on type
      if (el.type === "text") {
        const textContent = document.createElement("div");
        textContent.style.whiteSpace = "pre-wrap";
        textContent.style.width = "100%";
        textContent.style.height = "100%";

        // Font styles
        if (el.style) {
          textContent.style.fontSize = `${(el.style.fontSize || 20) * SCALE_FACTOR}px`;
          textContent.style.fontWeight = el.style.fontWeight || "normal";
          textContent.style.fontStyle = el.style.fontStyle || "normal";
          textContent.style.textAlign = el.style.textAlign || "left";
          if (el.style.textDecoration) textContent.style.textDecoration = el.style.textDecoration;
          textContent.style.color = el.style.color || "#000000";
          if (el.style.fontFamily) textContent.style.fontFamily = el.style.fontFamily;

          // Flex alignment for text (vertical)
          textContent.style.display = "flex";
          textContent.style.alignItems = el.style.alignItems || "flex-start";
          // Horizontal alignment correction for flex
          const alignMap: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end', justify: 'normal' };
          textContent.style.justifyContent = alignMap[el.style.textAlign || 'left'] || 'flex-start';
        }

        textContent.innerText = el.content;
        elDiv.appendChild(textContent);
      }
      else if (el.type === "image") {
        if (el.content && el.content !== 'uploading...') {
          const img = document.createElement("img");
          img.src = el.content;
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "cover"; // standard for this app
          img.style.display = "block";
          // Handle image load error placeholder
          img.onerror = () => {
            img.src = 'https://via.placeholder.com/300x200?text=エラー';
          };
          elDiv.appendChild(img);
        } else {
          // Placeholder for empty image
          elDiv.style.border = "2px dashed #ccc";
          elDiv.style.display = "flex";
          elDiv.style.justifyContent = "center";
          elDiv.style.alignItems = "center";
          elDiv.innerText = "画像";
        }
      }
      else if (el.type === "shape") {
        const shapeType = el.style?.shapeType || 'rectangle';
        const bg = el.style?.backgroundColor || '#3b82f6';

        if (shapeType === 'rectangle') {
          elDiv.style.backgroundColor = bg;
        } else if (shapeType === 'circle') {
          elDiv.style.backgroundColor = bg;
          elDiv.style.borderRadius = "50%";
        } else if (shapeType === 'triangle') {
          // Use SVG for triangle
          elDiv.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%; height:100%; display:block;">
                <polygon points="50,0 100,100 0,100" fill="${bg}" />
            </svg>`;
        }
      }

      slideDiv.appendChild(elDiv);
    });

    document.body.appendChild(slideDiv);

    try {
      const canvas = await html2canvas(slideDiv, {
        width: 1920,
        height: 1080,
        scale: 1, // We already scaled manually
        useCORS: true, // Allow cross-origin images
        allowTaint: true,
        backgroundColor: slide.backgroundColor,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "PNG", 0, 0, 1920, 1080);
    } catch (err) {
      console.error("Error capturing slide", i, err);
    } finally {
      document.body.removeChild(slideDiv);
    }
  }

  pdf.save(`${project.name || 'presentation'}.pdf`);
}
