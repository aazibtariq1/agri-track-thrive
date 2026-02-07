import { Link } from "react-router-dom";
import { AlertTriangle, Sprout } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NoCropsWarningProps {
  context: "expense" | "income";
}

export function NoCropsWarning({ context }: NoCropsWarningProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex items-center gap-4 py-4">
        <AlertTriangle className="h-8 w-8 text-destructive shrink-0" />
        <div className="flex-1">
          <p className="font-medium">No crops found</p>
          <p className="text-sm text-muted-foreground">
            You need to add a crop before recording {context === "expense" ? "expenses" : "income"}.
          </p>
        </div>
        <Link to="/crops">
          <Button size="sm">
            <Sprout className="mr-2 h-4 w-4" />
            Add Crop
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
