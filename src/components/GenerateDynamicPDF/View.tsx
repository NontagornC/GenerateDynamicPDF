/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import { useEffect, useRef, useState } from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import styled from "styled-components";

const View = () => {
  const dragAreaRef = useRef<HTMLDivElement>(null);
  const [deltaPosition, setDeltaPosition] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [useItemList, setItemList] = useState([]);

  const isInXAxisArea = (xAxis: number) => {
    if (xAxis >= 0 && xAxis <= 595) {
      return true;
    } else {
      return false;
    }
  };

  const isInYAxisArea = (yAxis: number) => {
    if (yAxis >= 0 && yAxis <= 842) {
      return true;
    } else {
      return false;
    }
  };

  const handleDrag = (_e: DraggableEvent, data: DraggableData) => {
    const { deltaX, deltaY } = data;
    setDeltaPosition((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  };

  const onStart = () => {};

  const onStop = (e: DraggableEvent | any, ui: DraggableData) => {
    const { deltaX, deltaY } = ui;
    const x = deltaPosition.x + deltaX;
    const y = deltaPosition.y + deltaY;
    const relateArr = useItemList;
    if (isInXAxisArea(x) && isInYAxisArea(y)) {
      console.log("อยู่ในกรอบที่ถูกต้อง");
      const textContent = e?.target?.textContent || "";
      console.log(e?.target?.id);
      // check id ตรงนี้
      const newData = [
        ...relateArr,
        {
          value: textContent,
          x: x,
          y: y,
        },
      ];
      setItemList(newData);
    } else if (isInXAxisArea(x) && !isInYAxisArea(y)) {
      console.log("อยู่ในกรอบแกน x");
      console.log("ไม่อยู่ในกรอบแกน y");
    } else if (!isInXAxisArea(x) && isInYAxisArea(y)) {
      console.log("ไม่อยู่ในกรอบแกน x");
      console.log("อยู่ในกรอบแกน y");
    } else if (!isInXAxisArea(x) && !isInYAxisArea(y)) {
      console.log("ไม่อยู่ทั้งกรอบแกน x และแกน y");
    }
  };

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

    const textArr = [
      // มุมบนซ้าย
      {
        x: convertXAxisToMM(0),
        y: convertYAxisToMM(0),
      },
      // มุมบนขวา
      {
        x: convertXAxisToMM(595),
        y: convertYAxisToMM(0),
      },
      // มุมล่างซ้าย
      {
        x: convertXAxisToMM(0),
        y: convertYAxisToMM(842),
      },
      // มุมล่างขวา
      {
        x: convertXAxisToMM(595),
        y: convertYAxisToMM(842),
      },
    ];

    useItemList.forEach((item) => {
      doc.text(
        String(item?.value),
        convertXAxisToMM(item.x),
        convertYAxisToMM(item.y)
      );
    });

    doc.save("my-pdf.pdf");
  }

  const dragHandlers = { onStart, onStop };

  useEffect(() => {
    if (dragAreaRef.current) {
      const rect = dragAreaRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.left,
      });
    }
  }, [dragAreaRef.current]);

  useEffect(() => {
    console.log(useItemList, "useItemList");
  }, [useItemList]);

  return (
    <div className=" relative flex min-h-screen w-full bg-outline-grey p-6">
      <div className=" flex min-h-full min-w-[300px] flex-col rounded-3xl bg-white-surface">
        <button
          onClick={() => {
            generatePDF();
          }}
        >
          Click to Export
        </button>
      </div>

      <div className="flex h-full w-full flex-1 items-center justify-center bg-outline-grey p-6">
        <DragArea
          ref={dragAreaRef}
          className="relative h-[842px] w-[595px] border border-dotted border-base-dark bg-white-surface"
        >
          <div className="absolute left-[0px] top-[0px] min-h-6 min-w-6 bg-red-600" />
        </DragArea>
      </div>
      <Draggable onDrag={handleDrag} {...dragHandlers} handle="">
        <div
          className="box flex h-6 w-6 bg-green-500"
          id={"111"}
          style={{
            position: "absolute",
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 100,
            width: "24px",
            height: "24px",
          }}
        >
          111 x: {deltaPosition.x.toFixed(0)}, y: {deltaPosition.y.toFixed(0)}
        </div>
      </Draggable>

      <Draggable onDrag={handleDrag} {...dragHandlers} handle="">
        <div
          className="box flex h-6 w-6 bg-green-500"
          id={"222"}
          style={{
            position: "absolute",
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 100,
            width: "24px",
            height: "24px",
          }}
        >
          222 x: {deltaPosition.x.toFixed(0)}, y: {deltaPosition.y.toFixed(0)}
        </div>
      </Draggable>
    </div>
  );
};

const DragArea = styled.div``;

export default View;
