import { Routes, Route } from "react-router-dom";
import DynamicGeneratePDF from "@/page/GenerateDynamicPDF/View";
import CutsomReportDashBoard from "@/page/MockTest/CutsomReportDashBoard";
import Mock2 from "@/page/MockTest/View";

const index = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<DynamicGeneratePDF />} />
        <Route path="/mock" element={<CutsomReportDashBoard />} />
        <Route path="/mock2" element={<Mock2 />} />
      </Routes>
    </>
  );
};

export default index;
