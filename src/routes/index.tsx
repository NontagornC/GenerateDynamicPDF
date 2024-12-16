import { Routes, Route } from "react-router-dom";
import Mock2 from "@/page/GenerateDynamicPDF/View";
import CutsomReportDashBoard from "@/page/MockTest/CutsomReportDashBoard";
import OldDynamicGeneratePDF from "@/page/MockTest/View";
import LastedDynamicGeneratePDF from "@/page/LastedDynamicPDF/View";

const index = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<LastedDynamicGeneratePDF />} />
        <Route path="/mock" element={<CutsomReportDashBoard />} />
        <Route path="/mock2" element={<Mock2 />} />
        <Route path="/mock3" element={<OldDynamicGeneratePDF />} />
      </Routes>
    </>
  );
};

export default index;
