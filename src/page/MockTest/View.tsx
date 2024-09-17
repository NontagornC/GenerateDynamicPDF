import React, { useState, useCallback, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { mockData } from "@/assets/mockData";
import { findKeyValue } from "@/utils";

const DraggableProvider = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <View />
    </DndProvider>
  );
};
// DraggableItem Component
interface DraggableItemProps {
  id: string;
  left: number;
  top: number;
  children: React.ReactNode;
}

// Types
// interface ChartDataItem {
//   name: string;
//   sales: number;
//   expenses: number;
// }

// interface TableColumn {
//   key: string;
//   name: string;
//   editable: boolean;
// }

// interface TableRow {
//   [key: string]: string;
// }

// interface ReportItem {
//   id: string;
//   title: string;
//   type: "chart" | "table";
//   data?: ChartDataItem[];
//   columns?: TableColumn[];
//   rows?: TableRow[];
//   left: number;
//   top: number;
// }

const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  left,
  top,
  children,
}) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "report-item",
      item: { id, left, top },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id, left, top]
  );

  const style: React.CSSProperties = {
    position: "absolute",
    left,
    top,
    opacity: isDragging ? 0.5 : 1,
    cursor: "move",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    backgroundColor: "white",
  };

  return (
    <div ref={drag} style={style}>
      {children}
    </div>
  );
};

const View = () => {
  const [useKeyArr, setKeyArr] = useState(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const moveItem = useCallback((id: string, left: number, top: number) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, left, top } : item))
    );
  }, []);

  const [, drop] = useDrop(
    () => ({
      accept: "report-item",
      drop(item: { id: string; left: number; top: number }, monitor) {
        const delta = monitor.getDifferenceFromInitialOffset();
        if (delta) {
          const left = Math.round(item.left + delta.x);
          const top = Math.round(item.top + delta.y);
          moveItem(item.id, left, top);
        }
      },
    }),
    [moveItem]
  );

  const printToPDF = async () => {
    const input = document.getElementById("report-container");
    if (input) {
      const canvas = await html2canvas(input, { scale: 2 }); // เพิ่ม scale เพื่อความคมชัดของภาพ
      const imgData = canvas.toDataURL("image/png");

      // ตั้งค่า jsPDF ให้เป็นขนาดกระดาษ A4
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210; // ความกว้างของ A4 ในหน่วยมิลลิเมตร
      const pdfHeight = 297; // ความสูงของ A4 ในหน่วยมิลลิเมตร

      // คำนวณขนาดของรูปภาพให้สัมพันธ์กับขนาด A4
      const imgProps = pdf.getImageProperties(canvas);
      const imgRatio = imgProps.width / imgProps.height;
      let canvasWidth, canvasHeight;

      if (imgRatio > 1) {
        canvasWidth = pdfWidth;
        canvasHeight = pdfWidth / imgRatio;
      } else {
        canvasHeight = pdfHeight;
        canvasWidth = pdfHeight * imgRatio;
      }

      // เพิ่มรูปภาพในขนาดที่คำนวณไว้ลงใน PDF
      pdf.addImage(imgData, "PNG", 0, 0, canvasWidth, canvasHeight);
      pdf.save("dashboard.pdf");
    }
  };

  useEffect(() => {
    if (mockData && mockData?.length > 0) {
      const keyArr = findKeyValue(mockData[0]);
      setKeyArr(keyArr);
    }
  }, [mockData]);

  // สร้าง state เพื่อเก็บ items ที่ถูกเลือก
  const [selectedItems, setSelectedItems] = useState([]);

  // ฟังก์ชันเพื่อจัดการการเลือกหรือยกเลิก checkbox
  const handleCheckboxChange = (item) => {
    setSelectedItems((prev) => {
      const foundItem = prev.find((i) => i.id === item);
      if (foundItem) {
        // ถ้า item มีอยู่แล้วใน state ให้ลบออก
        return prev.filter((i) => i.id !== item);
      } else {
        // ถ้า item ยังไม่อยู่ใน state ให้เพิ่ม object ใหม่เข้าไป
        return [
          ...prev,
          {
            id: item,
            title: item,
            type: item,
            data: item,
            left: 0,
            top: 0,
          },
        ];
      }
    });
  };

  useEffect(() => {
    console.log(selectedItems, "selectedItems");
  }, [selectedItems]);

  return (
    <>
      <div className="flex w-full p-6 border border-dashed border-red-300 flex-col">
        <div className="flex justify-between">
          <h1>Dynamic Generate</h1>
          <button onClick={printToPDF}>Print to PDF</button>{" "}
        </div>
        <div className="flex gap-4">
          <div className="flex flex-1 min-w-[100px] max-h-screen overflow-auto min-h-full p-4 bg-blue-200 rounded-3xl flex-col">
            {useKeyArr &&
              useKeyArr.length > 0 &&
              useKeyArr.map((item) => (
                <div key={item} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.some((i) => i.id === item)}
                    onChange={() => handleCheckboxChange(item)}
                  />
                  <span className="ml-2">{item}</span>
                </div>
              ))}
          </div>
          <div
            className="min-h-[842px] min-w-[595px] h-[842px] w-[595px]"
            ref={(node) => {
              if (node) {
                containerRef.current = node;
                drop(node);
              }
            }}
            id="report-container"
            style={{
              position: "relative",
              border: "1px solid #ccc",
            }}
          >
            {selectedItems &&
              selectedItems?.map((item) => {
                return (
                  <DraggableItem
                    key={item.id}
                    id={item.id}
                    left={item.left}
                    top={item.top}
                  >
                    {item?.data}
                  </DraggableItem>
                );
              })}
          </div>
        </div>
      </div>
      <span>2</span>
    </>
  );
};

export default DraggableProvider;
