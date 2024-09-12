import { useGenerateDynamicPDFContext } from "@/page/GenerateDynamicPDF/context";
import jsPDF from "jspdf";

const ViewModel = () => {
  const { useItemList } = useGenerateDynamicPDFContext();
  function pxToMm(px: number): number {
    return px * 0.35; // แปลงพิกเซลเป็นมิลลิเมตร
  }

  const convertXAxisToMM = (pxNumber: number) => {
    if (pxToMm(pxNumber) < 10) {
      return 10;
    } else if (pxToMm(pxNumber) > 200) {
      return 200;
    } else {
      return pxToMm(pxNumber);
    }
  };

  const convertYAxisToMM = (pxNumber: number) => {
    if (pxToMm(pxNumber) < 10) {
      return 10;
    } else if (pxToMm(pxNumber) > 287) {
      return 287;
    } else {
      return pxToMm(pxNumber);
    }
  };

  function generatePDF() {
    const doc = new jsPDF({
      orientation: "portrait", // 'landscape'
      unit: "mm", // ใช้มิลลิเมตรเป็นหน่วย
      format: "a4", // ขนาด A4
    });

    // const textArr = [
    //   // มุมบนซ้าย
    //   {
    //     x: convertXAxisToMM(0),
    //     y: convertYAxisToMM(0),
    //   },
    //   // มุมบนขวา
    //   {
    //     x: convertXAxisToMM(595),
    //     y: convertYAxisToMM(0),
    //   },
    //   // มุมล่างซ้าย
    //   {
    //     x: convertXAxisToMM(0),
    //     y: convertYAxisToMM(842),
    //   },
    //   // มุมล่างขวา
    //   {
    //     x: convertXAxisToMM(595),
    //     y: convertYAxisToMM(842),
    //   },
    // ];

    useItemList.forEach((item) => {
      doc.text(
        String(item?.value),
        convertXAxisToMM(item.x),
        convertYAxisToMM(item.y)
      );
    });

    doc.save("my-pdf.pdf");
  }

  return { generatePDF };
};

export default ViewModel;
