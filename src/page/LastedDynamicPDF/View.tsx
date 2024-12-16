import React, { useState, useCallback, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { mockData } from "@/assets/mockData";
import { findKeyValue } from "@/utils";
import Tooltip from "@mui/material/Tooltip";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "../../assets/vfs_fonts.js";
import { styled } from "styled-components";

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
    padding: "none",
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

  const handleItemClick = (itemId: string, currentWidth: number) => {
    setSelectedItemId(itemId);
    setEditWidth(String(currentWidth));
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
        console.log("this else");
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

  const lines = [
    // เส้นตรงแนวนอน
    {
      absolutePosition: { x: 40, y: 100 },
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 200,
          y2: 0,
          lineWidth: 1,
          lineColor: "black",
        },
      ],
    },
    // เส้นตรงแนวตั้ง
    {
      absolutePosition: { x: 100, y: 50 },
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 100,
          lineWidth: 2,
          lineColor: "red",
        },
      ],
    },
    // เส้นเฉียง
    {
      absolutePosition: { x: 150, y: 150 },
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
          lineWidth: 1,
          lineCap: "round",
          dash: { length: 5 }, // เส้นประ
          lineColor: "blue",
        },
      ],
    },
  ];

  const createPdf = () => {
    const content = selectedItems?.map((item) => {
      return {
        absolutePosition: { x: item?.left, y: item?.top },
        columns: item?.data?.map((text) => {
          return {
            width: item?.width,
            text: text,
          };
        }),
      };
    });
    const docDefinition = {
      info: {
        title: "awesome Document",
        subject: "subject of document",
      },
      pageMargins: [0, 0, 0, 0],
      content: [...content],
      // content: [...content, ...lines],
      pageSize: "A4",
      defaultStyle: {
        font: "IBMPlexSansThaiLooped",
      },
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

  return (
    <>
      <div className="flex w-full p-6 border border-dashed border-red-300 flex-col">
        <div className="flex justify-between">
          <h1>Dynamic Generate</h1>
          <button onClick={createPdf}>Preview PDF</button>
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
            className="max-h-[840px] min-w-[655px]"
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
            {selectedItems?.map((item) => (
              <DraggableItem
                key={item.id}
                id={item.id}
                left={item.left}
                top={item.top}
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
                            {item?.id}
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
                            <div className="mt-2 flex items-center gap-2">
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
                              {/* <button
                                onClick={(e) => {
                                  // e.stopPropagation();
                                  handleWidthChange(Number(editWidth));
                                  handleTooltipClose(item.id);
                                }}
                                className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                              >
                                Save
                              </button> */}
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(item.id, item.width);
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
                      onClick={() => {
                        handleItemClick(item.id, item.width);
                        handleTooltipOpen(item.id);
                      }}
                    >
                      {item?.key}
                    </ItemContainer>
                  </Tooltip>
                )}
              </DraggableItem>
            ))}
          </div>
          {/* <div
            className="max-h-[840px] min-w-[655px] "
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
                      <ItemContainer
                        className="flex flex-col gap-1 relative items-center justify-center"
                        width={item?.width}
                      >
                        {item?.key}
                      </ItemContainer>
                    </Tooltip>
                  </DraggableItem>
                );
              })}
          </div> */}
        </div>
      </div>
    </>
  );
};

// Update your ItemContainer styled component
const ItemContainer = styled.div<any>`
  width: ${(props) => `${props?.width * 1.2}px`};
  border: 1px solid ${(props) => (props.isSelected ? "#2196f3" : "red")};
  cursor: pointer;
  padding: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #2196f3;
  }
`;

export default DraggableProvider;
