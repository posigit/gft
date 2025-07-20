import { IconType } from "react-icons";
import React from "react";

declare module "react-icons/fi" {
  export const FiHome: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiMessageSquare: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiBarChart2: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiSettings: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiLogOut: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiMenu: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiX: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiBell: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiAlertCircle: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiClock: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiCheckCircle: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiStar: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiEdit: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiCheck: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiAlertTriangle: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiArrowLeft: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiSend: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiPlus: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiDownload: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiSearch: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiFilter: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiChevronLeft: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiChevronRight: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiUser: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiLock: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiPieChart: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiMail: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiSave: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiMapPin: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiCopy: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiPrinter: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiEdit2: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiTrash2: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiCode: React.FC<React.SVGProps<SVGSVGElement>>;
}

// Fix for React.createElement with IconType
declare module "react" {
  interface FunctionComponent<P = {}> {
    (props: PropsWithChildren<P>, context?: any): ReactElement<any, any> | null;
  }
}
