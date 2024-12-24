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
import InputNumber from "@/components/Input/InputNumber.js";

pdfMake.vfs = pdfFonts.vfs;

const DraggableProvider = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <View />
    </DndProvider>
  );
};
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
    useForm({
      defaultValues: {
        insertTextItem: null,
        headerHeight: 100,
        footerHeight: 100,
        selectImgId: null,
        editSelectImgSize: null,
        selectedTablePart: {},
      },
    });

  // const [selectedTablePart, setSelectedTablePart] = useState<{ [key: string]: 'header' | 'row' }>({});

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
      const keyArr = findKeyValue(mockData2);
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
      id: Date.now(),
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
    setEditSize(String(currentSize));
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

  const getValuesByKey = (data, key) => {
    return data.map((item) => item[key] || "-");
  };

  const getValuesByKey2 = (data, key) => {
    if (Array.isArray(data)) {
      return data[0]?.[key];
    }
    return data[key];
  };

  const getKeyObjectByMainKey = (data, key) => {
    const maxWidth = 450;
    if (data && key && data[key] && data[key]?.length > 0) {
      if (
        Object?.keys(data[key][0]) &&
        Object?.keys(data[key][0])?.length > 0
      ) {
        const keyArray = Object?.keys(data[key][0]);
        return keyArray?.map((item) => {
          return {
            [item]: maxWidth / keyArray?.length,
          };
        });
      }
    }
  };

  const handleCheckboxChange = (key: string) => {
    console.log(key, "item");
    const dataValue = getValuesByKey2(mockData2, key);
    const isTable = checkTableDataFormat(dataValue);
    let tableColumnWidth = null;
    console.log(dataValue, "dataVelue");
    if (isTable) {
      console.log(mockData2, "mock2");
      console.log(getKeyObjectByMainKey(mockData2, key), "mock 333");
      tableColumnWidth = getKeyObjectByMainKey(mockData2, key);
    }

    setSelectedItems((prev) => {
      const foundItem = prev.find((i) => i.id === key);
      if (foundItem) {
        setTooltipOpen((prevTooltip) => {
          const { [key]: removed, ...rest } = prevTooltip;
          return rest;
        });
        return prev.filter((i) => i.id !== key);
      } else {
        setTooltipOpen((prevTooltip) => ({
          ...prevTooltip,
          [key]: false,
        }));
        // 450 maximum
        const newItem = {
          key: key,
          id: key,
          title: key,
          type: isTable ? "table" : "key",
          data: dataValue,
          left: 0,
          top: 0,
          size: 16,
        };

        if (isTable) {
          return [
            ...prev,
            {
              ...newItem,
              headerBgColor: null,
              rowBgColor: null,
              width: 450,
              tableColumn: tableColumnWidth,
            },
          ];
        } else {
          return [
            ...prev,
            {
              ...newItem,
              width: 100,
              isBold: false,
            },
          ];
        }
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

  useEffect(() => {
    if (watch("selectedTablePart")) {
      console.log(watch("selectedTablePart"));
      console.log("111");
    }
  }, [watch("selectedTablePart")]);

  const createPdf = async () => {
    const A4_HEIGHT = 841.995;

    const tableData = selectedItems?.filter(
      (item) =>
        Array.isArray(item.data) &&
        item.data.length > 0 &&
        typeof item.data[0] === "object" &&
        !Array.isArray(item.data[0]) &&
        item?.type === "table"
    );

    const createTableContents = tableData.map((table) => {
      const headers = table?.data?.[0] ? Object.keys(table.data[0]) : [];
      const rows = table?.data?.map((item) => Object.values(item)) || [];

      const columnWidths = table?.tableColumn
        ? table.tableColumn.map((col) => Object.values(col)[0])
        : Array(headers.length).fill(Number(table?.width) / headers?.length);

      return {
        absolutePosition: {
          x: table?.left,
          y: table?.top,
        },
        table: {
          pageBreak: "after",
          body: [
            headers.map((header) => ({
              text: returnManualTruncateText(
                header,
                columnWidths[headers.indexOf(header)],
                8
              ),
              title: header,
              style: "tableHeader",
              bold: true,
              noWrap: true,
              fillColor: table?.headerBgColor || null,
            })),
            ...rows.map((row) =>
              row.map((cell, index) => ({
                text: returnManualTruncateText(cell, columnWidths[index], 6),
                title: cell,
                style: "tableCell",
                noWrap: true,
                fillColor: table?.rowBgColor || null,
              }))
            ),
          ],
          widths: columnWidths,
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
        },
      };
    });

    console.log(tableData, "tableData");

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
            // text: truncateText(header, 3),
            text: returnManualTruncateText(header, columnsWidth, 8),
            title: header,
            style: "tableHeader",
            bold: true,
            noWrap: true,
            // fillColor: "#dddddd",
            fillColor: tableData[0]?.headerBgColor || null,
          })),
          ...rows.map((row) =>
            row.map((cell) => ({
              // text: truncateText(cell, MAX_CHAR_COUNT,'fontSize'),
              text: returnManualTruncateText(cell, columnsWidth, 6),
              title: cell,
              style: "tableCell",
              noWrap: true,
              fillColor: tableData[0]?.rowBgColor || null,
            }))
          ),
        ],
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
          item?.top > watch("headerHeight") &&
          item?.top < A4_HEIGHT - watch("footerHeight") &&
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
                  bold: item?.isBold,
                }))
              : [
                  {
                    text: item?.data,
                    fontSize: item?.size,
                    bold: item?.isBold,
                  },
                ],
          },
        ],
      }));

    console.log(mainContent, "main content");

    const headerItems = selectedItems?.filter(
      (item) => item?.top <= watch("headerHeight")
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
      (item) => item?.top >= A4_HEIGHT - watch("footerHeight")
    );

    const footerContent = await Promise.all(
      footerItems?.map(async (item) => {
        if (item?.type === "image") {
          const base64String = await toBase64(item?.data?.[0]);
          return {
            image: base64String,
            absolutePosition: {
              x: item?.left,
              y: item?.top - (A4_HEIGHT - watch("footerHeight")),
            },
            fit: [item?.width, item?.width],
          };
        } else {
          return {
            text: item?.data[0],
            absolutePosition: {
              x: item?.left,
              y: item?.top - (A4_HEIGHT - watch("footerHeight")),
            },
            fontSize: item?.size,
            width: item?.width,
          };
        }
      }) || []
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
      header: headerContent,
      footer: footerContent,
      pageMargins: [40, watch("headerHeight"), 40, watch("footerHeight")],
      content: [
        ...imageContent,
        ...mainContent,
        ...createTableContents,
        {
          text: "",
          margin: [0, 0, 0, watch("footerHeight")],
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
      return;
    } else {
      console.log(event?.target?.files[0]);
      setSelectedItems((prev) => {
        return [
          ...prev,
          {
            key: event?.target?.files[0]?.name,
            id: `${event?.target?.files[0]?.name}-${
              event?.target?.files[0]?.lastModified
            }-${Date.now()}`,
            title: event?.target?.files[0]?.name,
            type: "image",
            data: [event?.target?.files[0]],
            left: 0,
            top: 0,
            width: 100,
          },
        ];
      });
    }
  };

  const handleChangePhotoWidth = (size) => {
    const imageId = watch("selectImgId");
    if (!imageId || !size) return;

    setSelectedItems((prevItems) =>
      prevItems.map((item) =>
        item.id === imageId ? { ...item, width: Number(size) } : item
      )
    );
    setValue("selectImgId", null);
    setValue("editSelectImgSize", null);
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
                <div
                  onClick={onChooseFile}
                  className="flex max-w-[160px] w-full cursor-pointer items-center justify-center rounded-lg border border-outline-grey bg-info-state-on-default px-4 py-[10px] font-semibold leading-6"
                >
                  อัปโหลดรูปภาพ
                </div>
                <input
                  type="file"
                  ref={inputUploadRef}
                  style={{ display: "none" }}
                  onChange={onChange}
                  accept=".jpg, .jpeg, .png"
                />
                <div className="mt-4">
                  {selectedItems
                    ?.filter((item) => {
                      return item?.type === "image";
                    })
                    ?.map((item) => (
                      <div key={item.id} className="mb-4 p-4 border rounded">
                        <h3 className="font-bold">{item.title}</h3>
                        <div className="flex items-center mt-2">
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={
                              watch("selectImgId") === item.id
                                ? watch("editSelectImgSize")
                                : item.width
                            }
                            onChange={(e) => {
                              setValue("selectImgId", item.id);
                              setValue("editSelectImgSize", e.target.value);
                            }}
                            className={`px-2 border py-1 rounded w-32 ${
                              watch("selectImgId") === item.id
                                ? "border-red-400"
                                : "border-gray-300"
                            }`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleChangePhotoWidth(
                                  watch("editSelectImgSize")
                                );
                              }
                            }}
                          />
                          <span className="ml-2">px</span>
                        </div>
                      </div>
                    ))}
                </div>
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
            <div className="flex flex-col gap-2 p-2 border border-blue-700">
              <span>ตัวเลขเพื่อปรับขนาด Footer, Header</span>
              <span>Header</span>
              <InputNumber
                disabled={false}
                register={register}
                registerName={`headerHeight`}
                initValue={watch("headerHeight")}
                textPosition={"right"}
                onBlur={(value: string) => {
                  setValue("headerHeight", Number(value));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setValue("headerHeight", Number(watch("headerHeight")));
                  }
                }}
                toFixed={2}
              />
              <span>Footer</span>
              <InputNumber
                disabled={false}
                register={register}
                registerName={`footerHeight`}
                initValue={watch("footerHeight")}
                textPosition={"right"}
                onBlur={(value: string) => {
                  setValue("footerHeight", Number(value));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setValue("footerHeight", Number(watch("footerHeight")));
                  }
                }}
                toFixed={2}
              />
            </div>
          </div>

          <div className="flex items-center w-full flex-col">
            {selectedItems
              ?.filter((item) => item?.type === "table")
              ?.map((table) => {
                return (
                  <div className="flex flex-col gap-2 p-4 border border-blue-700 w-full">
                    <label>Change Table Color: {table?.title}</label>
                    <input
                      type="color"
                      value={
                        watch("selectedTablePart")[table.id] === "header"
                          ? selectedItems.find((item) => item.id === table.id)
                              ?.headerBgColor || "#dddddd"
                          : selectedItems.find((item) => item.id === table.id)
                              ?.rowBgColor || "#dddddd"
                      }
                      onChange={(e) => {
                        const isHeader =
                          watch("selectedTablePart")[table.id] === "header";
                        setSelectedItems((prevItems) =>
                          prevItems.map((item) =>
                            item.id === table?.id
                              ? {
                                  ...item,
                                  [isHeader ? "headerBgColor" : "rowBgColor"]:
                                    e.target.value,
                                }
                              : item
                          )
                        );
                      }}
                      className="w-20 h-8"
                    />
                    <div className=" gap-2 justify-between flex">
                      <button
                        className={`h-[44px] w-1/2 border ${
                          watch("selectedTablePart")[table.id] === "header"
                            ? "bg-blue-500 text-white"
                            : ""
                        }`}
                        onClick={() => {
                          setValue("selectedTablePart", {
                            ...watch("selectedTablePart"),
                            [table.id]: "header",
                          });
                        }}
                      >
                        Header
                      </button>
                      <button
                        className={`h-[44px] w-1/2 border ${
                          watch("selectedTablePart")[table.id] === "row"
                            ? "bg-blue-500 text-white"
                            : ""
                        }`}
                        onClick={() => {
                          setValue("selectedTablePart", {
                            ...watch("selectedTablePart"),
                            [table.id]: "row",
                          });
                        }}
                      >
                        Row
                      </button>
                    </div>
                    <div className="grid w-full gap-2 grid-cols-2 border border-blue-200">
                      {table?.tableColumn &&
                        table?.tableColumn?.length > 0 &&
                        table?.tableColumn?.map((tableKey) => {
                          const key = Object.keys(tableKey)[0];
                          const value = tableKey[key];
                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between gap-4 p-2 border border-red-600 relative"
                            >
                              <span
                                onClick={() => {
                                  setSelectedItems((prev) =>
                                    prev.map((selectItem) => {
                                      if (selectItem?.id === table?.id) {
                                        // 1. ลบ column จาก tableColumn
                                        const newTableColumn =
                                          selectItem.tableColumn.filter(
                                            (col) => Object.keys(col)[0] !== key
                                          );

                                        // 2. ลบ column จาก data ทุกก้อน
                                        const newData = selectItem.data.map(
                                          (row) => {
                                            const newRow = { ...row };
                                            delete newRow[key];
                                            return newRow;
                                          }
                                        );

                                        return {
                                          ...selectItem,
                                          tableColumn: newTableColumn,
                                          data: newData,
                                        };
                                      }
                                      return selectItem;
                                    })
                                  );
                                }}
                                className="w-[20px] cursor-pointer h-[20px] flex justify-center items-center absolute -top-2 -right-2 bg-red-600 text-white rounded-full"
                              >
                                X
                              </span>
                              <span className="min-w-48 font-medium text-gray-700">
                                {key}:
                              </span>
                              <InputNumber
                                disabled={false}
                                register={register}
                                registerName={`columnWidth${key}`}
                                initValue={Number(value) || 0}
                                textPosition={"right"}
                                onBlur={(newValue: string) => {
                                  setSelectedItems((prev) =>
                                    prev.map((selectItem) => {
                                      if (selectItem?.id === table?.id) {
                                        return {
                                          ...selectItem,
                                          tableColumn:
                                            selectItem.tableColumn.map(
                                              (col) => {
                                                const colKey =
                                                  Object.keys(col)[0];
                                                if (colKey === key) {
                                                  return {
                                                    [key]: Number(newValue),
                                                  };
                                                }
                                                return col;
                                              }
                                            ),
                                        };
                                      }
                                      return selectItem;
                                    })
                                  );
                                }}
                                toFixed={2}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="flex gap-4 mt-4">
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
                height: `${watch("headerHeight")}px`,
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
                height: `${watch("footerHeight")}px`,
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
                    onClick={() => {
                      if (mode === "drag") {
                        setValue("selectImgId", item?.id);
                      }
                    }}
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
                                <div className="flex gap-1 w-full justify-between">
                                  <button
                                    onClick={() => {
                                      setSelectedItems((prev) =>
                                        prev.map((prevItem) =>
                                          prevItem.id === item.id // เปรียบเทียบกับ item.id ที่มาจาก parent
                                            ? { ...prevItem, isBold: false }
                                            : prevItem
                                        )
                                      );
                                    }}
                                    className={`h-[44px] w-1/2 border ${
                                      !item?.isBold
                                        ? "bg-blue-500 text-white"
                                        : ""
                                    }`}
                                  >
                                    Normal
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedItems((prev) =>
                                        prev.map((prevItem) =>
                                          prevItem.id === item.id // เปรียบเทียบกับ item.id ที่มาจาก parent
                                            ? { ...prevItem, isBold: true }
                                            : prevItem
                                        )
                                      );
                                    }}
                                    className={`h-[44px] w-1/2 border ${
                                      item?.isBold
                                        ? "bg-blue-500 text-white"
                                        : ""
                                    }`}
                                  >
                                    Bold
                                  </button>
                                </div>
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
                        isBold={item?.isBold}
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
  font-weight: ${({ isBold }) => (isBold ? 600 : 400)};
  border: 1px solid red;

  &:hover {
    border-color: ${(props) => (props.isDragMode ? "#2196f3" : "red")};
  }
  & > * {
    z-index: 2;
  }
`;

const ImageItem = styled.img<any>`
  width: ${(props) => `${props?.imgSize}px`};
  max-width: ${(props) => `${props?.imgSize}px`};
  height: ${(props) => `${props?.imgSize}px`};
  max-height: ${(props) => `${props?.imgSize}px`};
  object-fit: contain;
`;

export default DraggableProvider;
