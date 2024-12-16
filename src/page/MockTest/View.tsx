import React, { useState, useCallback, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { mockData } from "@/assets/mockData";
import { findKeyValue } from "@/utils";
import Tooltip from "@mui/material/Tooltip";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

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
    padding: isDragging ? "none" : "10px",
    //     border: "1px solid #ccc",
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
  // สร้าง state เพื่อเก็บ items ที่ถูกเลือก
  const [selectedItems, setSelectedItems] = useState([]);

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

  // const printToPDF = async () => {
  //   const input = document.getElementById("report-container");
  //   if (input) {
  //     const canvas = await html2canvas(input, { scale: 2 }); // เพิ่ม scale เพื่อความคมชัดของภาพ
  //     const imgData = canvas.toDataURL("image/png");

  //     // ตั้งค่า jsPDF ให้เป็นขนาดกระดาษ A4
  //     const pdf = new jsPDF("p", "mm", "a4");
  //     const pdfWidth = 210; // ความกว้างของ A4 ในหน่วยมิลลิเมตร
  //     const pdfHeight = 297; // ความสูงของ A4 ในหน่วยมิลลิเมตร

  //     // คำนวณขนาดของรูปภาพให้สัมพันธ์กับขนาด A4
  //     const imgProps = pdf.getImageProperties(canvas);
  //     const imgRatio = imgProps.width / imgProps.height;
  //     let canvasWidth, canvasHeight;

  //     if (imgRatio > 1) {
  //       canvasWidth = pdfWidth;
  //       canvasHeight = pdfWidth / imgRatio;
  //     } else {
  //       canvasHeight = pdfHeight;
  //       canvasWidth = pdfHeight * imgRatio;
  //     }

  //     // เพิ่มรูปภาพในขนาดที่คำนวณไว้ลงใน PDF
  //     pdf.addImage(imgData, "PNG", 0, 0, canvasWidth, canvasHeight);
  //     pdf.save("dashboard.pdf");
  //   }
  // };
  const printToPDF = async () => {
    const input = document.getElementById("report-container");

    if (input) {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvas = await html2canvas(input, {
        scale: 2, // เพิ่มความคมชัด
        useCORS: true, // เพื่อหลีกเลี่ยงปัญหา CORS
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // วาดรูปภาพแต่ละส่วนของ PDF
      while (heightLeft > 0) {
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        position -= pdfHeight;

        if (heightLeft > 0) {
          pdf.addPage();
          position = 0; // รีเซ็ตตำแหน่ง
        }
      }

      pdf.save("report.pdf");
    }
  };

  useEffect(() => {
    if (mockData && mockData?.length > 0) {
      const keyArr = findKeyValue(mockData[0]);
      setKeyArr(keyArr);
    }
  }, [mockData]);

  const getValuesByKey = (data, key) => {
    return data.map((item) => item[key] || "-"); // ดึงค่าออกมาตาม key ที่ระบุ
  };

  // ฟังก์ชันเพื่อจัดการการเลือกหรือยกเลิก checkbox
  const handleCheckboxChange = (item) => {
    const dataValue = getValuesByKey(mockData, item);
    setSelectedItems((prev) => {
      const foundItem = prev.find((i) => i.id === item);
      if (foundItem) {
        // ถ้า item มีอยู่แล้วใน state ให้ลบออก
        return prev.filter((i) => i.id !== item);
      } else {
        console.log("this else");
        // ถ้า item ยังไม่อยู่ใน state ให้เพิ่ม object ใหม่เข้าไป
        return [
          ...prev,
          {
            key: item,
            id: item,
            title: item,
            type: item,
            data: dataValue,
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

  const docDefinition = {
    content: [
      {
        absolutePosition: { x: 58, y: 52 },
        columns: [
          {
            // width: 100,
            text: "Simple absolute text width width 100",
          },
        ],
      },
      {
        svg: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 0C4.48603 0 0 4.48604 0 10C0 15.514 4.48603 20 10 20C15.514 20 20 15.514 20 10C20 4.48604 15.514 0 10 0ZM10 1.5C14.7033 1.5 18.5 5.2967 18.5 10C18.5 14.7033 14.7033 18.5 10 18.5C5.29669 18.5 1.5 14.7033 1.5 10C1.5 5.2967 5.29669 1.5 10 1.5ZM10 5C9.73478 5 9.48043 5.10536 9.29289 5.29289C9.10536 5.48043 9 5.73478 9 6C9 6.26522 9.10536 6.51957 9.29289 6.70711C9.48043 6.89464 9.73478 7 10 7C10.2652 7 10.5196 6.89464 10.7071 6.70711C10.8946 6.51957 11 6.26522 11 6C11 5.73478 10.8946 5.48043 10.7071 5.29289C10.5196 5.10536 10.2652 5 10 5ZM9.98828 8.48926C9.78954 8.49236 9.60016 8.57423 9.46173 8.71686C9.3233 8.8595 9.24715 9.05125 9.25 9.25V14.75C9.24859 14.8494 9.26696 14.9481 9.30402 15.0403C9.34108 15.1325 9.3961 15.2164 9.46588 15.2872C9.53566 15.358 9.61882 15.4142 9.71051 15.4526C9.8022 15.4909 9.90061 15.5107 10 15.5107C10.0994 15.5107 10.1978 15.4909 10.2895 15.4526C10.3812 15.4142 10.4643 15.358 10.5341 15.2872C10.6039 15.2164 10.6589 15.1325 10.696 15.0403C10.733 14.9481 10.7514 14.8494 10.75 14.75V9.25C10.7514 9.14962 10.7327 9.04997 10.6949 8.95695C10.6571 8.86394 10.6011 8.77946 10.53 8.70852C10.459 8.63758 10.3745 8.58161 10.2814 8.54395C10.1883 8.50629 10.0887 8.48769 9.98828 8.48926Z"
              fill="#98A2B3"
            />
          </svg>
        ),
        absolutePosition: { x: 58, y: 52 },
        fit: [150, 100],
      },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
      },
      subheader: {
        fontSize: 15,
        bold: true,
      },
      quote: {
        italics: true,
      },
      small: {
        fontSize: 8,
      },
    },
  };
  const [url, setUrl] = useState(null);

  const createPdf = () => {
    // const pdfGenerator = pdfMake.createPdf(docDefinition);
    pdfMake.createPdf(docDefinition).open();

    // pdfGenerator.getBlob((blob) => {
    //   const url = URL.createObjectURL(blob);
    //   setUrl(url);
    // });
    // pdfGenerator.download();
  };

  return (
    <>
      <div className="flex w-full p-6 border border-dashed border-red-300 flex-col">
        <div className="flex justify-between">
          <h1>Dynamic Generate</h1>
          <button onClick={printToPDF}>Print to PDF</button>{" "}
          <button onClick={createPdf}>Generate PDF2222</button>
          {url && <div>{url}</div>}
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
            className="min-h-[842px] min-w-[595px] "
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
                    <Tooltip
                      title={
                        <div className="p-1 flex justify-center items-center relative">
                          {item?.id}
                          <div
                            onClick={() => {
                              console.log("click tooltips");
                              handleCheckboxChange(item?.id);
                            }}
                            className="w-[12px] h-[12px] flex justify-center items-center absolute rounded-full bg-red-600 -top-[7px] -right-[12px]"
                          >
                            x
                          </div>
                        </div>
                      }
                      placement="top"
                      arrow
                    >
                      <div className="flex flex-col gap-1 relative">
                        {item?.data &&
                          item?.data?.length > 0 &&
                          item?.data?.map((itemValue, j) => {
                            return <span key={j + item?.id}>{itemValue}</span>;
                          })}
                        {/* {item?.key} */}
                      </div>
                    </Tooltip>
                  </DraggableItem>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
};

export default DraggableProvider;
