/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import DataGrid from "react-data-grid";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Types
interface ChartDataItem {
  name: string;
  sales: number;
  expenses: number;
}

interface TableColumn {
  key: string;
  name: string;
  editable: boolean;
}

interface TableRow {
  [key: string]: string;
}

interface ReportItem {
  id: string;
  title: string;
  type: "chart" | "table";
  data?: ChartDataItem[];
  columns?: TableColumn[];
  rows?: TableRow[];
  left: number;
  top: number;
}

// CustomBarChart Component
interface CustomBarChartProps {
  data: ChartDataItem[];
}

const CustomBarChart: React.FC<CustomBarChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: "Sales",
        data: data.map((item) => item.sales),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      {
        label: "Expenses",
        data: data.map((item) => item.expenses),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Sales and Expenses",
      },
    },
  };

  return <Bar data={chartData} options={options} />;
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

// CustomReportDashboard Component
const initialChartData: ChartDataItem[] = [
  { name: "Jan", sales: 4000, expenses: 2400 },
  { name: "Feb", sales: 3000, expenses: 1398 },
  { name: "Mar", sales: 2000, expenses: 9800 },
  { name: "Apr", sales: 2780, expenses: 3908 },
  { name: "May", sales: 1890, expenses: 4800 },
  { name: "Jun", sales: 2390, expenses: 3800 },
];

const CustomReportDashboard: React.FC = () => {
  const [reportItems, setReportItems] = useState<ReportItem[]>([
    {
      id: "sales",
      title: "Sales Overview",
      type: "chart",
      data: initialChartData,
      left: 0,
      top: 0,
    },
  ]);
  const [rows, setRows] = useState<string>("");
  const [columns, setColumns] = useState<string>("");

  const containerRef: any = useRef<HTMLDivElement>(null);

  const moveItem = useCallback((id: string, left: number, top: number) => {
    setReportItems((prevItems) =>
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
      const canvas = await html2canvas(input);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(canvas);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("dashboard.pdf");
    }
  };

  const generateTable = () => {
    const numRows = parseInt(rows);
    const numColumns = parseInt(columns);
    if (
      isNaN(numRows) ||
      isNaN(numColumns) ||
      numRows <= 0 ||
      numColumns <= 0
    ) {
      alert("Please enter valid numbers for rows and columns");
      return;
    }

    const newColumns: TableColumn[] = Array.from(
      { length: numColumns },
      (_, i) => ({
        key: `col${i}`,
        name: `Column ${i + 1}`,
        editable: true,
      })
    );

    const newRows: TableRow[] = Array.from({ length: numRows }, (_, rowIndex) =>
      newColumns.reduce(
        (acc, col, colIndex) => ({
          ...acc,
          [col.key]: `Cell ${rowIndex + 1}-${colIndex + 1}`,
        }),
        {}
      )
    );

    const newTable: ReportItem = {
      id: `table-${Date.now()}`,
      title: `Dynamic Table (${numRows}x${numColumns})`,
      type: "table",
      columns: newColumns,
      rows: newRows,
      left: 0,
      top: reportItems.length * 50,
    };

    setReportItems((prevItems) => [...prevItems, newTable]);
    setRows("");
    setColumns("");
  };

  const renderReportItem = (item: ReportItem) => {
    switch (item.type) {
      case "chart":
        return (
          <DraggableItem
            key={item.id}
            id={item.id}
            left={item.left}
            top={item.top}
          >
            <h2 style={{ marginBottom: "10px", cursor: "move" }}>
              {item.title}
            </h2>
            <div style={{ width: "300px", height: "200px" }}>
              <CustomBarChart data={item.data || []} />
            </div>
          </DraggableItem>
        );
      case "table":
        return (
          <DraggableItem
            key={item.id}
            id={item.id}
            left={item.left}
            top={item.top}
          >
            <h2 style={{ marginBottom: "10px", cursor: "move" }}>
              {item.title}
            </h2>
            <div style={{ width: "400px", height: "300px", overflow: "auto" }}>
              <DataGrid
                columns={item.columns || []}
                rows={item.rows || []}
                onRowsChange={(newRows: TableRow[]) => {
                  setReportItems((prevItems) =>
                    prevItems.map((prevItem) =>
                      prevItem.id === item.id
                        ? { ...prevItem, rows: newRows }
                        : prevItem
                    )
                  );
                }}
              />
            </div>
          </DraggableItem>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1
        style={{ marginBottom: "20px" }}
        className="text-white font-bold text-[32px]"
      >
        Custom Report Dashboard
      </h1>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={printToPDF}
          style={{ marginRight: "10px", padding: "5px 10px" }}
        >
          Print to PDF
        </button>
        <input
          type="number"
          value={rows}
          onChange={(e) => setRows(e.target.value)}
          placeholder="Rows"
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <input
          type="number"
          value={columns}
          onChange={(e) => setColumns(e.target.value)}
          placeholder="Columns"
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <button onClick={generateTable} style={{ padding: "5px 10px" }}>
          Add Table
        </button>
      </div>
      <div
        ref={(node) => {
          if (node) {
            containerRef.current = node;
            drop(node);
          }
        }}
        id="report-container"
        style={{
          position: "relative",
          minHeight: "600px",
          border: "1px solid #ccc",
        }}
      >
        {reportItems.map(renderReportItem)}
      </div>
    </div>
  );
};

// Main App Component
const DraggableDashboardApp: React.FC = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <CustomReportDashboard />
    </DndProvider>
  );
};

export default DraggableDashboardApp;
