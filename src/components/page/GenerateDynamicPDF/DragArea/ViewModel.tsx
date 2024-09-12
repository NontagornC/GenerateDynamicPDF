import { useGenerateDynamicPDFContext } from "@/page/GenerateDynamicPDF/context";

const ViewModel = () => {
  const {
    deltaPosition,
    setDeltaPosition,
    position,
    setPosition,
    setItemList,
    dragAreaRef,
    useItemList,
  } = useGenerateDynamicPDFContext();
  return {
    deltaPosition,
    setDeltaPosition,
    position,
    setPosition,
    setItemList,
    dragAreaRef,
    useItemList,
  };
};

export default ViewModel;
