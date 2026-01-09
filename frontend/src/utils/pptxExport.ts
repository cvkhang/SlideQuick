import PptxGenJS from "pptxgenjs";
import { Project, Slide, SlideElement } from "../types";

/**
 * Export project to PPTX
 */
export const exportToPPTX = async (project: Project) => {
  const pptx = new PptxGenJS();

  // Set Presentation Properties
  pptx.layout = "LAYOUT_16x9";
  pptx.title = project.name;
  pptx.author = project.ownerName || "SlideQuick User";

  // Process each slide
  project.slides.forEach((slide: Slide) => {
    const pptxSlide = pptx.addSlide();

    // 1. Background Color
    if (slide.backgroundColor) {
      if (slide.backgroundColor.startsWith("#")) {
        pptxSlide.background = { color: slide.backgroundColor.substring(1) };
      } else {
        // Handle other formats if needed, or default
        pptxSlide.background = { color: "FFFFFF" };
      }
    }

    // 2. Add Elements
    if (slide.elements) {
      slide.elements.forEach((element: SlideElement) => {
        // Calculate position and size (SlideQuick uses 960x540 base)
        // pptxgenjs uses inches by default. 960px / 96dpi = 10 inches.
        const x = element.x / 96;
        const y = element.y / 96;
        const w = element.width / 96;
        const h = element.height / 96;

        // Handle Text
        if (element.type === "text") {
          const fontSize = element.style?.fontSize || 16;
          // Convert px font size to points (approx 0.75 ratio usually, but direct mapping might be close enough for web->ppt)

          pptxSlide.addText(element.content, {
            x: x,
            y: y,
            w: w,
            h: h,
            fontSize: fontSize,
            color: element.style?.color?.replace("#", "") || "000000",
            fill: element.style?.backgroundColor ? { color: element.style.backgroundColor.replace("#", "") } : undefined,
            align: element.style?.textAlign as any || "left",
            // valign: "top", // Default
            fontFace: "Arial", // Default fallback
            isTextBox: true,
          });
        }

        // Handle Image
        else if (element.type === "image") {
          // Check if it's a valid URL or Base64
          if (element.content) {
            pptxSlide.addImage({
              path: element.content,
              x: x,
              y: y,
              w: w,
              h: h,
            });
          }
        }

        // Handle Shape
        else if (element.type === "shape") {
          let shapeType = pptx.ShapeType.rect;
          if (element.style?.shapeType === "circle") shapeType = pptx.ShapeType.ellipse;
          if (element.style?.shapeType === "triangle") shapeType = pptx.ShapeType.triangle;

          pptxSlide.addShape(shapeType, {
            x: x,
            y: y,
            w: w,
            h: h,
            fill: { color: element.style?.backgroundColor?.replace("#", "") || "3B82F6" },
          });
        }
      });
    }
  });

  // Save the file
  await pptx.writeFile({ fileName: `${project.name}.pptx` });
};
