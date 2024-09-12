/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GenerateDynamicContextProvider } from "./context";
import SideMenu from "@/components/page/GenerateDynamicPDF/SideMenu/View";
import DragArea from "@/components/page/GenerateDynamicPDF/DragArea/View";
import ViewModel from "./ViewModel";

const ViewWrapper = () => {
  return (
    <GenerateDynamicContextProvider>
      <View />
    </GenerateDynamicContextProvider>
  );
};

const View = () => {
  ViewModel();

  return (
    <div className="relative flex min-h-screen w-full bg-outline-grey p-6">
      <SideMenu />
      <DragArea />
    </div>
  );
};

export default ViewWrapper;
