import React, { useState, useCallback, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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

  //   const docDefinition = {
  //     content: [
  //       {
  //         absolutePosition: { x: 58, y: 52 },
  //         columns: [
  //           {
  //             // width: 100,
  //             text: "Simple absolute text width width 100",
  //           },
  //         ],
  //       },
  //     ],
  //   };

  const createPdf = () => {
    const content = selectedItems?.map((item) => {
      return {
        absolutePosition: { x: item?.left, y: item?.top },
        columns: item?.data?.map((text) => {
          return {
            // width: 100,
            text: text,
          };
        }),
      };
    });
    const docDefinition = {
      content: content,
    };
    pdfMake.createPdf(docDefinition).open();
  };

  return (
    <>
      <div className="flex w-full p-6 border border-dashed border-red-300 flex-col">
        <div className="flex justify-between">
          <h1>Dynamic Generate</h1>
          <button onClick={createPdf}>Generate PDF</button>
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
                        {item?.key}
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
