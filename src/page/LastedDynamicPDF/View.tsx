import React, { useState, useCallback, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { mockData } from "@/assets/mockData";
import { findKeyValue } from "@/utils";
import Tooltip from "@mui/material/Tooltip";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "../../assets/vfs_fonts.js";
import { styled } from "styled-components";
import { useForm } from "react-hook-form";

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
  isDragMode: any;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  left,
  top,
  children,
  isDragMode,
}) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "report-item",
      item: { id, left, top },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: () => isDragMode,
    }),
    [id, left, top, isDragMode]
  );

  const style: React.CSSProperties = {
    position: "absolute",
    left,
    top,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragMode ? "move" : "default", // เปลี่ยน cursor ตามโหมด
    padding: "none",
    borderRadius: "5px",
    backgroundColor: "white",
    pointerEvents: isDragMode ? "auto" : "none", // ปิดการ interact เมื่อไม่ได้อยู่ในโหมด drag
  };

  return (
    <div ref={drag} style={style}>
      {children}
    </div>
  );
};

const View = () => {
  const { register, watch, setValue, control, resetField, reset, getValues } =
    useForm({});

  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentLine, setCurrentLine] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [lineStyle, setLineStyle] = useState({
    color: "#000000",
    width: 1,
    type: "solid", // 'solid', 'dashed', 'dotted'
  });

  // เพิ่ม state สำหรับโหมดการทำงาน (drag items หรือ draw line)
  const [mode, setMode] = useState("drag"); // 'drag' or 'draw'
  const [useKeyArr, setKeyArr] = useState(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // สร้าง state เพื่อเก็บ items ที่ถูกเลือก
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editWidth, setEditWidth] = useState("");

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

  const handleLineClick = (lineId) => {
    setSelectedLine(lineId);
  };

  const handleLineDelete = (lineId) => {
    setLines((prev) => prev.filter((line) => line.id !== lineId));
    setSelectedLine(null);
  };

  const updateLineStyle = (lineId, newStyle) => {
    setLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, ...newStyle } : line))
    );
  };

  const handleMouseDown = (e) => {
    // console.log("mouse down");
    if (mode !== "draw") return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentLine({
      id: Date.now(), // ใช้ timestamp เป็น id
      start: { x, y },
      end: { x, y },
      ...lineStyle,
    });
  };

  const handleMouseMove = (e) => {
    // console.log("mouse move");
    if (!isDrawing || mode !== "draw") return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentLine((prev) => ({
      ...prev,
      end: { x, y },
    }));
  };

  const handleMouseUp = () => {
    // console.log("mouse up");
    if (!isDrawing || mode !== "draw") return;

    setIsDrawing(false);
    if (currentLine) {
      setLines((prev) => [...prev, currentLine]);
    }
    setCurrentLine(null);
  };

  const getValuesByKey = (data, key) => {
    return data.map((item) => item[key] || "-"); // ดึงค่าออกมาตาม key ที่ระบุ
  };

  const handleWidthChange = (newWidth: number) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) =>
        item.id === selectedItemId ? { ...item, width: newWidth } : item
      )
    );
    setIsEditing(false);
    setEditWidth("");
  };

  const handleItemClick = (
    itemId: string,
    currentWidth: number,
    currentSize: number
  ) => {
    setSelectedItemId(itemId);
    setEditWidth(String(currentWidth));
    setEditSize(String(currentSize)); // เพิ่มการ set ค่าเริ่มต้นของ size
    setIsEditing(true);
  };

  // ฟังก์ชันเพื่อจัดการการเลือกหรือยกเลิก checkbox
  const handleCheckboxChange = (item) => {
    const dataValue = getValuesByKey(mockData, item);
    setSelectedItems((prev) => {
      const foundItem = prev.find((i) => i.id === item);
      if (foundItem) {
        // ถ้า item มีอยู่แล้วใน state ให้ลบออก
        setTooltipOpen((prevTooltip) => {
          const { [item]: removed, ...rest } = prevTooltip;
          return rest;
        });
        return prev.filter((i) => i.id !== item);
      } else {
        setTooltipOpen((prevTooltip) => ({
          ...prevTooltip,
          [item]: false,
        }));
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
            size: 16,
            width: 100,
          },
        ];
      }
    });
  };

  useEffect(() => {
    if (selectedItems.length > 0) {
      const initialTooltipState = selectedItems.reduce((acc, item) => {
        acc[item.id] = false;
        return acc;
      }, {});
      setTooltipOpen(initialTooltipState);
    }
  }, [selectedItems]);

  useEffect(() => {
    console.log(selectedItems, "selectedItems");
  }, [selectedItems]);

  pdfMake.fonts = {
    IBMPlexSansThaiLooped: {
      normal: "IBMPlexSansThaiLooped-Regular.ttf",
      bold: "IBMPlexSansThaiLooped-Bold.ttf",
      italics: "IBMPlexSansThaiLooped-Bold.ttf",
      bolditalics: "IBMPlexSansThaiLooped-Bold.ttf",
    },
  };

  // const liness = [
  //   // เส้นตรงแนวนอน
  //   {
  //     absolutePosition: { x: 40, y: 100 },
  //     canvas: [
  //       {
  //         type: "line",
  //         x1: 0,
  //         y1: 0,
  //         x2: 200,
  //         y2: 0,
  //         lineWidth: 1,
  //         lineColor: "black",
  //       },
  //     ],
  //   },
  //   // เส้นตรงแนวตั้ง
  //   {
  //     absolutePosition: { x: 100, y: 50 },
  //     canvas: [
  //       {
  //         type: "line",
  //         x1: 0,
  //         y1: 0,
  //         x2: 0,
  //         y2: 100,
  //         lineWidth: 2,
  //         lineColor: "red",
  //       },
  //     ],
  //   },
  //   // เส้นเฉียง
  //   {
  //     absolutePosition: { x: 150, y: 150 },
  //     canvas: [
  //       {
  //         type: "line",
  //         // x1, y1 - จุดเริ่มต้นของเส้น
  //         x1: 0,
  //         y1: 0,
  //         // x2, y2 - จุดสิ้นสุดของเส้น
  //         x2: 100,
  //         y2: 100,
  //         // lineWidth - ความหนาของเส้น
  //         lineWidth: 1,
  //         // lineCap - รูปแบบจุดสิ้นสุดของเส้น ('butt', 'round', 'square')
  //         lineCap: "round",
  //         // dash - กำหนดรูปแบบเส้นประ
  //         dash: { length: 5 }, // เส้นประ
  //         // lineColor - สีของเส้น
  //         lineColor: "blue",
  //       },
  //     ],
  //   },
  // ];

  const createPdf = () => {
    const content = selectedItems?.map((item) => {
      return {
        absolutePosition: { x: item?.left, y: item?.top },
        columns: item?.data?.map((text) => {
          return {
            width: item?.width,
            text: text,
            fontSize: item?.size,
          };
        }),
      };
    });

    // const lineElements = lines.map((line) => ({
    //   absolutePosition: { x: 0, y: 0 },
    //   canvas: [
    //     {
    //       type: "line",
    //       x1: line.start.x,
    //       y1: line.start.y,
    //       x2: line.end.x,
    //       y2: line.end.y,
    //       lineWidth: line.width,
    //       lineColor: line.color,
    //       dash:
    //         line.type === "dashed"
    //           ? { length: 5 }
    //           : line.type === "dotted"
    //           ? { length: 2 }
    //           : undefined,
    //     },
    //   ],
    // }));

    // แปลงเส้นเป็น canvas elements เพื่อให้สามารถอยู่เป็น bg ได้
    const lineElements = lines.map((line) => ({
      type: "line",
      x1: line.start.x,
      y1: line.start.y,
      x2: line.end.x,
      y2: line.end.y,
      lineWidth: line.width,
      lineColor: line.color,
      dash:
        line.type === "dashed"
          ? { length: 5 }
          : line.type === "dotted"
          ? { length: 2 }
          : undefined,
    }));

    const docDefinition = {
      info: {
        title: "awesome Document",
        subject: "subject of document",
      },
      // แบบ static header แบบง่าย
      // header: {
      //   columns: [
      //     { text: "ชื่อบริษัท", alignment: "left", margin: [40, 20] },
      //     { text: "เอกสารสำคัญ", alignment: "right", margin: [0, 20, 40, 0] },
      //   ],
      // },

      // // แบบ dynamic footer ที่แสดงเลขหน้า
      // footer: function (currentPage, pageCount, pageSize) {
      //   return [
      //     // สร้างเส้นคั่นด้านบน footer
      //     {
      //       canvas: [
      //         {
      //           type: "line",
      //           x1: 40,
      //           y1: 0,
      //           x2: pageSize.width - 40,
      //           y2: 0,
      //           lineWidth: 0.5,
      //           lineColor: "#999999",
      //         },
      //       ],
      //     },
      //     // ข้อความใน footer
      //     {
      //       columns: [
      //         {
      //           text: "วันที่พิมพ์: " + new Date().toLocaleDateString("th-TH"),
      //           alignment: "left",
      //           margin: [40, 10, 0, 0],
      //         },
      //         {
      //           text: "หน้า " + currentPage + " จาก " + pageCount,
      //           alignment: "right",
      //           margin: [0, 10, 40, 0],
      //         },
      //       ],
      //     },
      //   ];
      // },

      pageMargins: [40, 60, 40, 60], // ให้มีพื้นที่สำหรับ header และ footer
      content: [...content],
      // content: [...content, ...lineElements],
      // content: [...content, ...liness],
      pageSize: "A4",
      defaultStyle: {
        font: "IBMPlexSansThaiLooped",
      },

      // ใช้ foreground แทน background ถ้าต้องการให้เส้นอยู่ด้านบน
      // foreground: [
      //   {
      //     canvas: lineElements
      //   },

      // ใช้ foreground แทน background ถ้าต้องการให้เส้นอยู่ด้านล่าง
      background: [
        {
          canvas: lineElements,
        },
      ],
    };
    pdfMake.createPdf(docDefinition).open();
  };

  const [tooltipOpen, setTooltipOpen] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Add handler for tooltip
  const handleTooltipOpen = (itemId: string) => {
    setTooltipOpen((prev) => ({
      ...prev,
      [itemId]: true,
    }));
  };

  const handleTooltipClose = (itemId: string) => {
    setTooltipOpen((prev) => ({
      ...prev,
      [itemId]: false,
    }));
  };

  const LineControls = () => (
    <div className="flex flex-col gap-4 p-4 bg-gray-100 rounded-lg border border-blue-700">
      <h3 className="font-bold">Line Settings</h3>

      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <label>Color:</label>
        <input
          type="color"
          value={lineStyle.color}
          onChange={(e) => {
            setLineStyle((prev) => ({ ...prev, color: e.target.value }));
            if (selectedLine) {
              updateLineStyle(selectedLine, { color: e.target.value });
            }
          }}
          className="w-20 h-8"
        />
      </div>

      {/* Line Width */}
      <div className="flex items-center gap-2">
        <label>Width:</label>
        <input
          type="range"
          min="1"
          max="10"
          value={lineStyle.width}
          onChange={(e) => {
            const width = Number(e.target.value);
            setLineStyle((prev) => ({ ...prev, width }));
            if (selectedLine) {
              updateLineStyle(selectedLine, { width });
            }
          }}
          className="w-32"
        />
        <span>{lineStyle.width}px</span>
      </div>

      {/* Line Type */}
      <div className="flex items-center gap-2">
        <label>Style:</label>
        <select
          value={lineStyle.type}
          onChange={(e) => {
            setLineStyle((prev) => ({ ...prev, type: e.target.value }));
            if (selectedLine) {
              updateLineStyle(selectedLine, { type: e.target.value });
            }
          }}
          className="px-2 py-1 rounded border"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>

      {/* Delete Button (only shown when a line is selected) */}
      {selectedLine && (
        <button
          onClick={() => handleLineDelete(selectedLine)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete Selected Line
        </button>
      )}
    </div>
  );

  const DrawingLines = () => (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        // ปรับ pointer-events ให้เป็น none ที่ตัว SVG container
        pointerEvents: "none",
        zIndex: 1, // ให้อยู่ด้านบน draggable items
      }}
    >
      {lines.map((line) => (
        <line
          key={line.id}
          x1={line.start.x}
          y1={line.start.y}
          x2={line.end.x}
          y2={line.end.y}
          stroke={line.color}
          strokeWidth={line.width}
          strokeDasharray={
            line.type === "dashed"
              ? "5,5"
              : line.type === "dotted"
              ? "2,2"
              : "none"
          }
          onClick={(e) => {
            if (mode !== "draw") {
              e.stopPropagation();
              handleLineClick(line.id);
            }
          }}
          style={{
            cursor: mode === "draw" ? "crosshair" : "pointer",
          }}
          className={selectedLine === line.id ? "opacity-70" : ""}
          // เพิ่ม pointer-events ให้กับแต่ละเส้น
          pointerEvents={mode === "draw" ? "none" : "stroke"}
        />
      ))}
      {mode === "draw" && currentLine && (
        <line
          x1={currentLine.start.x}
          y1={currentLine.start.y}
          x2={currentLine.end.x}
          y2={currentLine.end.y}
          stroke={currentLine.color}
          strokeWidth={currentLine.width}
          strokeDasharray={
            currentLine.type === "dashed"
              ? "5,5"
              : currentLine.type === "dotted"
              ? "2,2"
              : "none"
          }
          pointerEvents="none"
        />
      )}
    </svg>
  );

  const onClickInsertText = () => {
    const text = watch("insertTextItem");
    setSelectedItems((prev) => {
      return [
        ...prev,
        {
          key: text,
          id: text + new Date(),
          title: text,
          type: "text",
          data: [text],
          left: 0,
          top: 0,
          size: 36,
          width: 100,
        },
      ];
    });
    setValue("insertTextItem", "");
  };

  const [editSize, setEditSize] = useState("");

  // เพิ่มฟังก์ชันจัดการการเปลี่ยนแปลงขนาดตัวอักษร
  const handleSizeChange = (newSize: number) => {
    const size = Number(newSize);
    if (!isNaN(size)) {
      setSelectedItems((prevItems) =>
        prevItems.map((item) =>
          item.id === selectedItemId ? { ...item, size: size } : item
        )
      );
    }
    setEditSize("");
  };

  useEffect(() => {
    if (lines && lines?.length > 0) {
      console.log(lines, "lines");
    }
  }, [lines]);

  return (
    <>
      <div className="flex w-full p-6 border border-dashed border-red-300 flex-col">
        <div className="flex items-start gap-2 flex-col">
          <h1>Dynamic Generate</h1>
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col gap-2 p-2 border border-blue-700">
              <span>กรอก Text เพื่อนำไปนำไปแสดงใน report</span>
              <input
                {...register(`insertTextItem`, {
                  required: false,
                })}
                value={watch("insertTextItem")}
                disabled={false}
                placeholder={"Insert text item"}
                className="h-[44px] flex-1 rounded-lg border-1 border-outline-grey p-[16px] placeholder:text-lighter-400 disabled:bg-disable/light-disable-light"
              />{" "}
              <button
                onClick={onClickInsertText}
                disabled={watch("insertTextItem")?.length <= 0}
                className={`border p-1 ${
                  watch("insertTextItem")?.length > 0
                    ? "border-red-400"
                    : "border-none"
                }`}
              >
                กดตรงนี้ครับ
              </button>
            </div>
            {LineControls()}
            <div className="flex flex-col gap-2 p-4 border border-blue-700">
              <div className="flex gap-2 p-2">
                <button
                  onClick={() => setMode(mode === "drag" ? "draw" : "drag")}
                  className={`px-4 py-2 rounded ${
                    mode === "draw" ? "bg-blue-500 text-white" : "bg-gray-200"
                  }`}
                >
                  {mode === "drag" ? "Switch to Draw" : "Switch to Drag"}
                </button>
              </div>

              <button
                className="bg-green-300 p-2 rounded-lg"
                onClick={createPdf}
              >
                Generate PDF
              </button>
            </div>
          </div>
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
            className="max-h-[840px] min-w-[600px]"
            ref={(node) => {
              if (node) {
                containerRef.current = node;
                mode === "drag" && drop(node);
              }
            }}
            id="report-container"
            style={{
              position: "relative",
              border: "1px solid #ccc",
              backgroundImage: `
              linear-gradient(#ccc 1px, transparent 1px),
              linear-gradient(90deg, #ccc 1px, transparent 1px)
            `,
              backgroundSize: "30px 30px",
              backgroundColor: "white",
            }}
            onMouseDown={mode === "draw" ? handleMouseDown : undefined}
            onMouseMove={mode === "draw" ? handleMouseMove : undefined}
            onMouseUp={mode === "draw" ? handleMouseUp : undefined}
            onMouseLeave={mode === "draw" ? handleMouseUp : undefined}
          >
            {selectedItems?.map((item) => (
              <DraggableItem
                key={item.id}
                id={item.id}
                left={item.left}
                top={item.top}
                isDragMode={mode === "drag"}
              >
                {tooltipOpen[item.id] !== undefined && (
                  <Tooltip
                    open={tooltipOpen[item.id]}
                    onOpen={() => handleTooltipOpen(item.id)}
                    onClose={() => handleTooltipClose(item.id)}
                    title={
                      <div className="p-1 flex justify-center items-center relative">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2">
                            {item?.title}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckboxChange(item?.id);
                                handleTooltipClose(item.id);
                              }}
                              className="w-[12px] h-[12px] flex justify-center items-center rounded-full bg-red-600 cursor-pointer"
                            >
                              x
                            </div>
                          </div>
                          {isEditing && selectedItemId === item.id ? (
                            <div className="mt-2 flex items-center gap-2 flex-col">
                              <span>ความกว้างของ Box</span>
                              <input
                                type="number"
                                value={editWidth}
                                onChange={(e) => setEditWidth(e.target.value)}
                                className="w-20 px-2 py-1 rounded text-black"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleWidthChange(Number(editWidth));
                                    handleTooltipClose(item.id);
                                  }
                                }}
                              />
                              <span>ขนาดตัวอักษร</span>
                              <input
                                type="number"
                                value={editSize}
                                onChange={(e) => setEditSize(e.target.value)}
                                className="w-20 px-2 py-1 rounded text-black"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSizeChange(Number(editSize));
                                  }
                                }}
                                onBlur={() =>
                                  handleSizeChange(Number(editSize))
                                } // เพิ่ม onBlur
                              />
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(
                                  item.id,
                                  item.width,
                                  item?.size
                                );
                              }}
                              className="mt-2 px-2 py-1 bg-gray-200 text-black rounded text-sm"
                            >
                              Edit Width
                            </button>
                          )}
                        </div>
                      </div>
                    }
                    placement="top"
                    arrow
                  >
                    <ItemContainer
                      className="flex flex-col gap-1 relative items-start justify-center"
                      width={item?.width}
                      fontSize={item?.size}
                      isSelected={selectedItemId === item.id || false}
                      onClick={(e) => {
                        if (mode === "drag") {
                          handleItemClick(item.id, item.width, item?.size);
                          handleTooltipOpen(item.id);
                        }
                      }}
                    >
                      {item?.key}
                    </ItemContainer>
                  </Tooltip>
                )}
              </DraggableItem>
            ))}
            {/* {mode === "draw" && <DrawingLines />} */}
            <DrawingLines />
          </div>
        </div>
      </div>
    </>
  );
};

// Update your ItemContainer styled component
const ItemContainer = styled.div<any>`
  /* padding: 8px; */
  width: ${(props) => `${props?.width * 1.2}px`};
  border: 1px solid ${(props) => (props.isSelected ? "#2196f3" : "red")};
  cursor: ${(props) => (props.isDragMode ? "move" : "default")};
  transition: all 0.2s ease;
  font-size: ${(props) => `${props?.fontSize}px`};

  &:hover {
    border-color: ${(props) => (props.isDragMode ? "#2196f3" : "red")};
  }
  & > * {
    z-index: 2;
  }
`;

export default DraggableProvider;
