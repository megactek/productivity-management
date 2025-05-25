"use client";

import { useState } from "react";
import { Project, ProjectRisk } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { AlertTriangle, Plus, Edit, Trash } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ProjectRisksProps {
  project: Project;
  onAddRisk: (riskData: Omit<ProjectRisk, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateRisk: (riskId: string, riskData: Partial<Omit<ProjectRisk, "id" | "createdAt">>) => void;
  onDeleteRisk: (riskId: string) => void;
}

export function ProjectRisks({ project, onAddRisk, onUpdateRisk, onDeleteRisk }: ProjectRisksProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRisk, setNewRisk] = useState<{
    title: string;
    description: string;
    impact: ProjectRisk["impact"];
    probability: ProjectRisk["probability"];
    status: ProjectRisk["status"];
  }>({
    title: "",
    description: "",
    impact: "medium",
    probability: "medium",
    status: "identified",
  });
  const [editRisk, setEditRisk] = useState<{
    title: string;
    description: string;
    impact: ProjectRisk["impact"];
    probability: ProjectRisk["probability"];
    status: ProjectRisk["status"];
  }>({
    title: "",
    description: "",
    impact: "medium",
    probability: "medium",
    status: "identified",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRisk.title.trim()) {
      onAddRisk({
        title: newRisk.title.trim(),
        description: newRisk.description.trim() || undefined,
        impact: newRisk.impact,
        probability: newRisk.probability,
        status: newRisk.status,
      });
      setNewRisk({
        title: "",
        description: "",
        impact: "medium",
        probability: "medium",
        status: "identified",
      });
      setIsAdding(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editRisk.title.trim()) {
      onUpdateRisk(editingId, {
        title: editRisk.title.trim(),
        description: editRisk.description.trim() || undefined,
        impact: editRisk.impact,
        probability: editRisk.probability,
        status: editRisk.status,
      });
      setEditingId(null);
    }
  };

  const startEdit = (risk: ProjectRisk) => {
    setEditRisk({
      title: risk.title,
      description: risk.description || "",
      impact: risk.impact,
      probability: risk.probability,
      status: risk.status,
    });
    setEditingId(risk.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Get risk severity color
  const getRiskSeverityColor = (impact: ProjectRisk["impact"], probability: ProjectRisk["probability"]): string => {
    const severityMap = {
      low: {
        low: "bg-green-100 text-green-800",
        medium: "bg-green-100 text-green-800",
        high: "bg-yellow-100 text-yellow-800",
      },
      medium: {
        low: "bg-green-100 text-green-800",
        medium: "bg-yellow-100 text-yellow-800",
        high: "bg-orange-100 text-orange-800",
      },
      high: {
        low: "bg-yellow-100 text-yellow-800",
        medium: "bg-orange-100 text-orange-800",
        high: "bg-red-100 text-red-800",
      },
    };

    return severityMap[impact]?.[probability] || "bg-gray-100 text-gray-800";
  };

  // Get status badge color
  const getStatusColor = (status: ProjectRisk["status"]): string => {
    const statusMap = {
      identified: "bg-blue-100 text-blue-800",
      mitigated: "bg-green-100 text-green-800",
      occurred: "bg-red-100 text-red-800",
      resolved: "bg-gray-100 text-gray-800",
    };

    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  // Sort risks by severity (high impact & probability first)
  const sortedRisks = [...(project.risks || [])].sort((a, b) => {
    const impactWeight = { low: 1, medium: 2, high: 3 };
    const probWeight = { low: 1, medium: 2, high: 3 };

    const aScore = (impactWeight[a.impact] || 0) * (probWeight[a.probability] || 0);
    const bScore = (impactWeight[b.impact] || 0) * (probWeight[b.probability] || 0);

    return bScore - aScore; // Descending order
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Project Risks</h3>
        {!isAdding && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} className="flex items-center gap-1">
            <Plus size={16} />
            <span>Add Risk</span>
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-4">
          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div>
              <label htmlFor="new-risk-title" className="text-sm font-medium block mb-1">
                Risk Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="new-risk-title"
                value={newRisk.title}
                onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                placeholder="Describe the risk"
                required
              />
            </div>
            <div>
              <label htmlFor="new-risk-description" className="text-sm font-medium block mb-1">
                Description
              </label>
              <Textarea
                id="new-risk-description"
                value={newRisk.description}
                onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                placeholder="Provide details about this risk"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="new-risk-impact" className="text-sm font-medium block mb-1">
                  Impact
                </label>
                <Select
                  id="new-risk-impact"
                  value={newRisk.impact}
                  onChange={(e) => setNewRisk({ ...newRisk, impact: e.target.value as ProjectRisk["impact"] })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </div>
              <div>
                <label htmlFor="new-risk-probability" className="text-sm font-medium block mb-1">
                  Probability
                </label>
                <Select
                  id="new-risk-probability"
                  value={newRisk.probability}
                  onChange={(e) =>
                    setNewRisk({ ...newRisk, probability: e.target.value as ProjectRisk["probability"] })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </div>
              <div>
                <label htmlFor="new-risk-status" className="text-sm font-medium block mb-1">
                  Status
                </label>
                <Select
                  id="new-risk-status"
                  value={newRisk.status}
                  onChange={(e) => setNewRisk({ ...newRisk, status: e.target.value as ProjectRisk["status"] })}
                >
                  <option value="identified">Identified</option>
                  <option value="mitigated">Mitigated</option>
                  <option value="occurred">Occurred</option>
                  <option value="resolved">Resolved</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Add Risk
              </Button>
            </div>
          </form>
        </Card>
      )}

      {(!project.risks || project.risks.length === 0) && !isAdding && (
        <p className="text-sm text-muted-foreground">
          No risks identified yet. Add potential risks to manage them effectively.
        </p>
      )}

      <div className="space-y-3">
        {sortedRisks.map((risk) => (
          <Card key={risk.id} className="p-4">
            {editingId === risk.id ? (
              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label htmlFor={`edit-risk-${risk.id}-title`} className="text-sm font-medium block mb-1">
                    Risk Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id={`edit-risk-${risk.id}-title`}
                    value={editRisk.title}
                    onChange={(e) => setEditRisk({ ...editRisk, title: e.target.value })}
                    placeholder="Describe the risk"
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`edit-risk-${risk.id}-description`} className="text-sm font-medium block mb-1">
                    Description
                  </label>
                  <Textarea
                    id={`edit-risk-${risk.id}-description`}
                    value={editRisk.description}
                    onChange={(e) => setEditRisk({ ...editRisk, description: e.target.value })}
                    placeholder="Provide details about this risk"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor={`edit-risk-${risk.id}-impact`} className="text-sm font-medium block mb-1">
                      Impact
                    </label>
                    <Select
                      id={`edit-risk-${risk.id}-impact`}
                      value={editRisk.impact}
                      onChange={(e) => setEditRisk({ ...editRisk, impact: e.target.value as ProjectRisk["impact"] })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor={`edit-risk-${risk.id}-probability`} className="text-sm font-medium block mb-1">
                      Probability
                    </label>
                    <Select
                      id={`edit-risk-${risk.id}-probability`}
                      value={editRisk.probability}
                      onChange={(e) =>
                        setEditRisk({ ...editRisk, probability: e.target.value as ProjectRisk["probability"] })
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor={`edit-risk-${risk.id}-status`} className="text-sm font-medium block mb-1">
                      Status
                    </label>
                    <Select
                      id={`edit-risk-${risk.id}-status`}
                      value={editRisk.status}
                      onChange={(e) => setEditRisk({ ...editRisk, status: e.target.value as ProjectRisk["status"] })}
                    >
                      <option value="identified">Identified</option>
                      <option value="mitigated">Mitigated</option>
                      <option value="occurred">Occurred</option>
                      <option value="resolved">Resolved</option>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-orange-500" />
                    <h4 className="font-medium">{risk.title}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(risk)}
                      className="h-7 w-7"
                    >
                      <Edit size={15} className="text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteRisk(risk.id)}
                      className="h-7 w-7"
                    >
                      <Trash size={15} className="text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>

                {risk.description && <p className="text-sm mt-2 text-muted-foreground">{risk.description}</p>}

                <div className="flex flex-wrap gap-2 mt-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskSeverityColor(
                      risk.impact,
                      risk.probability
                    )}`}
                  >
                    {risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1)} Impact
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskSeverityColor(
                      risk.impact,
                      risk.probability
                    )}`}
                  >
                    {risk.probability.charAt(0).toUpperCase() + risk.probability.slice(1)} Probability
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(risk.status)}`}>
                    {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground mt-2">Added: {formatDate(risk.createdAt)}</div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
