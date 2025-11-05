// app/programs/section.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import { Loading } from "../components/common/Loading";
import type { CampaignProps } from '../types/global.types';

type Program = {
  _id: string;
  name: string;
  curriculum_id: string;
  start_date: string;
  end_date: string;
  pricing: number;
  subjects: string[];
  timetable: Record<string, { subject: string; time: string }[]>;
  created_at: string;
  updated_at?: string;
};

export default function ProgramsSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const itemsPerPage = 8;

  const convex = useConvex();
  const programs = useQuery(api.program.listPrograms) as Program[] | undefined;
  const campaigns = useQuery(api.campaign.getAllCampaigns) as CampaignProps[] | undefined;

  // Fetch enrollment counts for each program
  useEffect(() => {
    if (!programs || !campaigns) return;

    async function fetchEnrollmentCounts() {
      const counts: Record<string, number> = {};

      for (const program of programs!) {
        // Find all campaigns for this program
        const programCampaigns = campaigns?.filter(
          (c) => c.program_id === program._id
        ) || [];

        let totalEnrollments = 0;

        // Fetch enrollments for each campaign
        for (const campaign of programCampaigns) {
          try {
            const enrollments = await convex.query(
              api.program_enrollments.listByCampaign,
              { campaignId: campaign._id }
            );
            totalEnrollments += enrollments.length;
          } catch (error) {
            console.error(`Error fetching enrollments for campaign ${campaign._id}:`, error);
          }
        }

        counts[program._id] = totalEnrollments;
      }

      setEnrollmentCounts(counts);
    }

    fetchEnrollmentCounts();
  }, [programs, campaigns, convex]);

  // Filter programs based on search and active/inactive status
  const filteredPrograms = programs?.filter((program) => {
    const matchesSearch = program.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    // Check if program is active based on end_date
    const isActive = new Date(program.end_date) >= new Date();
    const matchesTab = activeTab === "active" ? isActive : !isActive;

    return matchesSearch && matchesTab;
  });

  // Pagination
  const totalPages = Math.ceil((filteredPrograms?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrograms = filteredPrograms?.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Count campaigns for each program
  const getCampaignsCount = (programId: string) => {
    return campaigns?.filter((c) => c.program_id === programId).length || 0;
  };

  // Count engagements (enrollments) for each program
  const getEngagementsCount = (programId: string) => {
    return enrollmentCounts[programId] || 0;
  };

  // Count purchases for each program (placeholder)
  const getPurchasesCount = (programId: string) => {
    // This would come from your actual purchases/transactions data
    return 23;
  };

  if (programs === undefined) {
    return <Loading message="Loading programs..." size="lg" />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Programs</h1>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("active");
            setCurrentPage(1);
          }}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
            activeTab === "active"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active
          {activeTab === "active" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("inactive");
            setCurrentPage(1);
          }}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
            activeTab === "inactive"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Inactive
          {activeTab === "inactive" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Table */}
      <div className="border border-muted rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-muted/50">
              <TableHead>Program</TableHead>
              <TableHead>Campaigns</TableHead>
              <TableHead>Engagements</TableHead>
              <TableHead>Purchases</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPrograms && paginatedPrograms.length > 0 ? (
              paginatedPrograms.map((program) => (
                <TableRow 
                  key={program._id} 
                  className="border-b border-muted/30 last:border-0"
                >
                  <TableCell className="py-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Program</p>
                      <p className="text-sm font-medium text-foreground">
                        {program.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Campaigns</p>
                      <p className="text-sm font-medium text-foreground">
                        {getCampaignsCount(program._id)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Engagements</p>
                      <p className="text-sm font-medium text-foreground">
                        {getEngagementsCount(program._id)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Purchases</p>
                      <p className="text-sm font-medium text-foreground">
                        {getPurchasesCount(program._id)}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No programs found
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}