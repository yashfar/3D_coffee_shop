import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowBigLeftDashIcon,
  ArrowBigRightDashIcon,
} from "@hugeicons/core-free-icons";
export default function TourArrow({ left = false }: { left?: boolean }) {
  return (
    <span className="tour-arrow hidden" aria-hidden="true">
      <HugeiconsIcon
        icon={left ? ArrowBigLeftDashIcon : ArrowBigRightDashIcon}
        size={23}
        color="currentColor"
        strokeWidth={1.3}
      />
    </span>
  );
}
