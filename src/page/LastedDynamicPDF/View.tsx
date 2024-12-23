import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  ChangeEvent,
} from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { mockData, mockData2 } from "@/assets/mockData";
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
    cursor: isDragMode ? "move" : "default",
    padding: "none",
    borderRadius: "5px",
    backgroundColor: "white",
    pointerEvents: isDragMode ? "auto" : "none",
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
  const [headerHeight, setHeaderHeight] = useState(100);
  const [footerheight, setFooterHieght] = useState(100);

  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentLine, setCurrentLine] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [lineStyle, setLineStyle] = useState({
    color: "#000000",
    width: 1,
    type: "solid",
  });

  const [mode, setMode] = useState("drag"); // 'drag' or 'draw'
  const [useKeyArr, setKeyArr] = useState(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
    console.log(e.clientX, "ClientX");
    console.log(e.clientY, "ClientY");
    console.log(rect.left, "rect.left");
    console.log(rect.top, "rect.top");
    const x = e.clientX - rect.left;
    console.log(x, "x");
    const y = e.clientY - rect.top;
    console.log(y, "y");

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
    return data.map((item) => item[key] || "-");
  };
  const getValuesByKey2 = (data, key) => {
    if (Array.isArray(data)) {
      // ถ้าเป็น array ให้ดึงค่าเฉพาะ key จาก object แรก
      return data[0]?.[key];
    }
    // ถ้าเป็น object ธรรมดาให้ดึงค่าโดยตรง
    return data[key];
  };

  const getValuesByKeyInObject = (objectData, key) => {
    return objectData[key] || null;
  };

  const isArray = (data: any): boolean => Array.isArray(data);

  const isArrayOfObjects = (data: any): boolean => {
    return (
      Array.isArray(data) &&
      data.length > 0 &&
      typeof data[0] === "object" &&
      !Array.isArray(data[0])
    );
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

  const checkTableDataFormat = (data: any[]) => {
    return (
      Array.isArray(data) &&
      data.length > 0 &&
      typeof data[0] === "object" &&
      !Array.isArray(data[0])
    );
  };

  // ฟังก์ชันเพื่อจัดการการเลือกหรือยกเลิก checkbox
  const handleCheckboxChange = (item: string) => {
    console.log(item, "item");
    // const dataValue = getValuesByKey(mockData, item);
    const dataValue = getValuesByKey2(mockData2, item);
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
            type: checkTableDataFormat(dataValue) ? "table" : "key",
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

  function calculateMaxCharacters(
    width: number,
    fontSize: number,
    textWidthFactor = 0.6
  ) {
    return Math.floor(width / (fontSize * textWidthFactor));
  }

  const truncateText = (text: string, maxLength: number) => {
    if (typeof text !== "string") text = String(text);
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const returnManualTruncateText = (
    text: string,
    width: number,
    fontSize: number
  ) => {
    const maxChar = calculateMaxCharacters(width, fontSize);
    return truncateText(text, maxChar);
  };

  const toBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  const createPdf = async () => {
    const A4_HEIGHT = 841.995;
    const TOP_MARGIN = 100;

    const tableData = selectedItems?.filter(
      (item) =>
        Array.isArray(item.data) &&
        item.data.length > 0 &&
        typeof item.data[0] === "object" &&
        !Array.isArray(item.data[0])
    );

    const headers = tableData?.[0]?.data?.[0]
      ? Object.keys(tableData[0].data[0])
      : [];

    const rows = tableData?.[0]?.data?.map((item) => Object.values(item)) || [];
    const columnsWidth = Number(tableData[0]?.width) / headers?.length;
    const tableContent = {
      absolutePosition: {
        x: tableData[0]?.left,
        y: tableData[0]?.top,
      },
      table: {
        pageBreak: "after",
        // headerRows: 1,
        body: [
          headers.map((header) => ({
            // text: truncateText(header, 3), // ตัดข้อความใน header
            text: returnManualTruncateText(header, columnsWidth, 8), // ตัดข้อความใน header
            title: header,
            style: "tableHeader",
            bold: true,
            noWrap: true,
          })),
          ...rows.map((row) =>
            row.map((cell) => ({
              // text: truncateText(cell, MAX_CHAR_COUNT), // ตัดข้อความใน cell
              text: returnManualTruncateText(cell, columnsWidth, 6), // ตัดข้อความใน header
              title: cell,
              style: "tableCell",
              noWrap: true,
            }))
          ),
        ],
        // widths: Array(headers.length).fill("auto"),
        widths: Array(headers.length).fill(columnsWidth),
      },
      layout: {
        hLineWidth: function (i, node) {
          return 1;
        },
        vLineWidth: function (i, node) {
          return 1;
        },
        hLineColor: function (i, node) {
          return "#aaa";
        },
        vLineColor: function (i, node) {
          return "#aaa";
        },
        // paddingLeft: function (i, node) {
        //   return 4;
        // },
        // paddingRight: function (i, node) {
        //   return 4;
        // },
        // paddingTop: function (i, node) {
        //   return 2;
        // },
        // paddingBottom: function (i, node) {
        //   return 2;
        // },
      },
    };

    // Process image content
    const imageContent = await Promise.all(
      selectedItems
        ?.filter((imgItem) => imgItem?.type === "image")
        ?.map(async (imgItem) => {
          const base64String = await toBase64(imgItem?.data?.[0]);
          return {
            image: base64String,
            fit: [imgItem?.width, imgItem?.width],
            absolutePosition: { x: imgItem?.left, y: imgItem?.top },
          };
        }) || []
    );

    console.log(imageContent, "imageContent");

    const mainContent = selectedItems
      ?.filter(
        (item) =>
          item?.top > headerHeight &&
          item?.top < A4_HEIGHT - footerheight &&
          !tableData?.some((tableItem) => tableItem?.key === item?.key) &&
          item?.type !== "image"
      )
      ?.map((item) => ({
        absolutePosition: {
          x: item?.left,
          y: item?.top,
        },
        columns: [
          {
            width: item?.width,
            stack: Array.isArray(item?.data)
              ? item?.data?.map((text) => ({
                  text: text,
                  fontSize: item?.size,
                }))
              : [
                  {
                    text: item?.data,
                    fontSize: item?.size,
                  },
                ],
          },
        ],
      }));

    console.log(mainContent, "main content");

    const headerItems = selectedItems?.filter(
      (item) => item?.top <= headerHeight
    );

    const headerContent = await Promise.all(
      headerItems?.map(async (item) => {
        if (item?.type === "image") {
          const base64String = await toBase64(item?.data?.[0]);
          return {
            image: base64String,
            absolutePosition: {
              x: item?.left,
              y: item?.top,
            },
            fit: [item?.width, item?.width],
          };
        } else {
          return {
            text: item?.data[0],
            absolutePosition: {
              x: item?.left,
              y: item?.top,
            },
            fontSize: item?.size,
            width: item?.width,
          };
        }
      }) || []
    );

    console.log(headerItems, "headerItems");

    const footerItems = selectedItems?.filter(
      (item) => item?.top >= A4_HEIGHT - footerheight
    );

    console.log(footerItems, "footerItems");

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
      // header: function (currentPage, pageCount, pageSize) {
      //   return headerItems?.map((item) => ({
      //     text: item?.data[0],
      //     absolutePosition: {
      //       x: item?.left,
      //       y: item?.top,
      //     },
      //     fontSize: item?.size,
      //     width: item?.width,
      //   }));
      // },
      header: headerContent,
      footer: function (currentPage, pageCount, pageSize) {
        console.log(pageSize.height - A4_HEIGHT - footerItems[0]?.top);
        return footerItems?.map((item) => ({
          text: item?.data[0],
          absolutePosition: {
            x: item?.left,
            y: item?.top - (A4_HEIGHT - 100),
          },
          fontSize: item?.size,
          width: item?.width,
        }));
      },
      pageMargins: [40, TOP_MARGIN, 40, 100],
      content: [
        // {
        //   image: base64String,
        //   fit: [100, 100],
        //   absolutePosition: { x: 300, y: 300 },
        // },
        ...imageContent,
        ...mainContent,
        tableContent,
        {
          text: "",
          margin: [0, 0, 0, 100],
        },
      ],
      pageSize: {
        width: 595.35,
        height: 841.995,
      },
      defaultStyle: {
        font: "IBMPlexSansThaiLooped",
      },
      styles: {
        tableHeader: {
          fontSize: 8,
          bold: true,
          alignment: "left",
          fillColor: "#f8f9fa",
          maxHeight: 22,
          noWrap: true,
        },
        tableCell: {
          fontSize: 6,
          alignment: "left",
          maxHeight: 20,
          noWrap: true,
          color: "#1d4ed8",
        },
      },
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
    <div className="flex flex-col gap-4 p-4 bg-gray-100 truncate rounded-lg border border-blue-700">
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

  // updateload file
  const inputUploadRef = useRef(null);

  const accecptFilesArray = ["jpg", "jpeg", "png"];
  const maxFileSize = 1024 * 1024;

  const onChooseFile = () => {
    inputUploadRef?.current?.click();
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileSize = event?.target?.files[0]?.size;
    const fileType = event?.target?.files[0]?.type?.split("/")[1];
    if (!accecptFilesArray.includes(fileType)) {
      console.log("validate file type");
      return;
    }
    if (fileSize > maxFileSize) {
      console.log("exceed file size");
    } else {
      console.log(event?.target?.files[0]);
      setSelectedItems((prev) => {
        return [
          ...prev,
          {
            key: event?.target?.files[0]?.name,
            id:
              event?.target?.files[0]?.name +
              "-" +
              event?.target?.files[0]?.lastModified,
            title: event?.target?.files[0]?.name,
            type: "image",
            data: [event?.target?.files[0]],
            left: 0,
            top: 0,
            size: 36,
            width: 100,
          },
        ];
      });
    }
  };

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
            <div className="flex flex-col gap-2">
              <>
                <Container
                  maxWidth={160}
                  onClick={onChooseFile}
                  className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-outline-grey bg-info-state-on-default px-4 py-[10px] font-semibold leading-6"
                >
                  อัปโหลดรูปภาพ
                </Container>
                <input
                  type="file"
                  ref={inputUploadRef}
                  style={{ display: "none" }}
                  onChange={onChange}
                  accept=".jpg, .jpeg, .png"
                />
              </>
            </div>
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
            className="max-h-[842px] min-w-[595px]"
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
            {/* Header Area Zone */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${headerHeight}px`,
                backgroundColor: "rgba(173, 216, 230, 0.2)", // Light blue with opacity
                borderBottom: "2px dashed #A9A9A9",
                pointerEvents: "none", // ให้คลิกผ่านได้
                zIndex: 1,
              }}
            >
              <span className="absolute top-2 left-2 text-gray-500">
                Header Area
              </span>
            </div>

            {/* Footer Area Zone */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: `${footerheight}px`,
                backgroundColor: "rgba(144, 238, 144, 0.2)", // Light green with opacity
                borderTop: "2px dashed #A9A9A9",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              <span className="absolute bottom-2 left-2 text-gray-500">
                Footer Area
              </span>
            </div>

            {selectedItems?.map((item) =>
              item?.type === "image" ? (
                <DraggableItem
                  key={item.id}
                  id={item.id}
                  left={item.left}
                  top={item.top}
                  isDragMode={mode === "drag"}
                >
                  <ImageItem
                    src={URL.createObjectURL(item?.data[0])}
                    imgSize={item?.width}
                  />
                </DraggableItem>
              ) : (
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
              )
            )}
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
  width: ${(props) => `${props?.width * 1.3}px`};
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

interface IContainerProps {
  maxWidth: number;
}

const Container = styled.div<IContainerProps>`
  max-width: ${(props) => (props.maxWidth ? `${props.maxWidth}px` : "160px")};
`;

const ImageItem = styled.img<any>`
  width: ${(props) => `${props?.imgSize}px`};
  max-width: ${(props) => `${props?.imgSize}px`};
  height: ${(props) => `${props?.imgSize}px`};
  max-height: ${(props) => `${props?.imgSize}px`};
`;

export default DraggableProvider;
