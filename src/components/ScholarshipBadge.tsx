import { Badge } from "@/components/ui/badge";
import { Award, DollarSign } from "lucide-react";

interface ScholarshipBadgeProps {
  hasHec: boolean;
  hasUsaid: boolean;
}

export default function ScholarshipBadge({ hasHec, hasUsaid }: ScholarshipBadgeProps) {
  if (!hasHec && !hasUsaid) {
    return (
      <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-200">
        <DollarSign className="w-3 h-3 mr-1 text-slate-400" />
        Merit Aid Available
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {hasHec && (
        <Badge variant="hec" className="flex items-center gap-1 shadow-sm">
          <Award className="w-3 h-3 text-emerald-600" />
          <span>HEC Need-Based</span>
        </Badge>
      )}
      {hasUsaid && (
        <Badge variant="usaid" className="flex items-center gap-1 shadow-sm">
          <Award className="w-3 h-3 text-blue-600" />
          <span>USAID Partner</span>
        </Badge>
      )}
    </div>
  );
}
