/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState } from "react";
import { createContext, useContext } from "react";
import {
  Control,
  FieldErrors,
  useFieldArray,
  UseFieldArrayRemove,
  UseFieldArrayReplace,
  UseFieldArrayUpdate,
  useForm,
  UseFormGetValues,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormReset,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

export interface InitialValuteProps {
  register: UseFormRegister<HookFormDefaultValues>;
  getValues: UseFormGetValues<HookFormDefaultValues>;
  watch: UseFormWatch<HookFormDefaultValues>;
  setValue: UseFormSetValue<HookFormDefaultValues>;
  reset: UseFormReset<HookFormDefaultValues>;
  control: Control<HookFormDefaultValues>;
  errors: FieldErrors<HookFormDefaultValues>;
  handleSubmit?: UseFormHandleSubmit<HookFormDefaultValues, undefined>;
  equipmentList: Record<"id", string>[];
  updateEquipmentList: UseFieldArrayUpdate<
    HookFormDefaultValues,
    "equipmentList"
  >;
  replaceEquipmentList: UseFieldArrayReplace<
    HookFormDefaultValues,
    "equipmentList"
  >;
  removeEquipmentList: UseFieldArrayRemove;
  useItemList: any[];
  setItemList: React.Dispatch<React.SetStateAction<any[]>>;
  deltaPosition: any;
  setDeltaPosition: any;
  position: any;
  setPosition: any;
  dragAreaRef: React.MutableRefObject<HTMLDivElement>;
}

export interface HookFormDefaultValues {
  plantCode: string;
  equipmentList: any[];
}

// eslint-disable-next-line react-refresh/only-export-components
export const defaultValueForm = (): HookFormDefaultValues => {
  return {
    plantCode: "",
    equipmentList: null,
  };
};

interface GenerateDynamicContextType {
  children: React.ReactNode;
}

const GenerateDynamicContext = createContext<InitialValuteProps>(undefined);

const InitialValue = () => {
  const dragAreaRef = useRef<HTMLDivElement>(null);

  const {
    register,
    getValues,
    watch,
    setValue,
    reset,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValueForm(),
  });

  const {
    fields: equipmentList,
    update: updateEquipmentList,
    replace: replaceEquipmentList,
    remove: removeEquipmentList,
  } = useFieldArray({
    control,
    name: "equipmentList",
  });

  const [useItemList, setItemList] = useState([]);
  const [deltaPosition, setDeltaPosition] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ top: 0, left: 0 });

  return {
    register,
    getValues,
    watch,
    setValue,
    reset,
    errors,
    control,
    handleSubmit,
    equipmentList,
    updateEquipmentList,
    replaceEquipmentList,
    removeEquipmentList,
    useItemList,
    setItemList,
    deltaPosition,
    setDeltaPosition,
    position,
    setPosition,
    dragAreaRef,
  };
};

export const GenerateDynamicContextProvider = ({
  children,
}: GenerateDynamicContextType) => {
  return (
    <GenerateDynamicContext.Provider value={{ ...InitialValue() }}>
      {children}
    </GenerateDynamicContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGenerateDynamicPDFContext = () => {
  const context = useContext(GenerateDynamicContext);
  if (!context) {
    throw new Error(
      "useGenerateDynamicPDFContext must be used within a GenerateDynamicContext"
    );
  }
  return context;
};
