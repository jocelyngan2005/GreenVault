"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import useSmartContract from "@/lib/useSmartContract";
import { smartContractService } from "@/lib/smartContractService";

// Custom hook for verifying project
function useVerifyProject() {
	return useSmartContract((projectId: string, privateKey?: string) =>
		smartContractService.verifyProject(projectId, privateKey)
	);
}

interface Project {
	id: string;
	name: string;
	type: string;
	location: string;
	co2Amount: number;
	status: "draft" | "submitted" | "verified" | "listed";
	nftMinted: boolean;
	salesCount: number;
	totalRevenue: number;
	createdDate: string;
}

export default function ProjectVerificationPage() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const { execute: verifyProject, loading: verifyLoading } = useVerifyProject();
	const [verifyingId, setVerifyingId] = useState<string | null>(null);

	// Load projects from localStorage
	useEffect(() => {
		const stored = localStorage.getItem("projects");
		if (stored) {
			setProjects(JSON.parse(stored));
		}
	}, []);

	// Helper to update localStorage when projects change
	const updateProjects = (newProjects: Project[]) => {
		setProjects(newProjects);
		localStorage.setItem("projects", JSON.stringify(newProjects));
	};

	// Handle verification
	const handleVerify = async (project: Project) => {
		setVerifyingId(project.id);
		try {
			const result = await verifyProject(project.id);
			if (result.success) {
				setNotification({
					type: "success",
					message: `Project verified! TX: ${result.txDigest?.slice(0, 10)}...`,
				});
				// Update project status and persist
				updateProjects(
					projects.map((p) =>
						p.id === project.id ? { ...p, status: "verified" } : p
					)
				);
			} else {
				setNotification({
					type: "error",
					message: result.error || "Verification failed",
				});
			}
		} catch (error) {
			setNotification({
				type: "error",
				message: "Verification failed. Please try again.",
			});
		}
		setVerifyingId(null);
	};

	// Clear notification after 5 seconds
	useEffect(() => {
		if (notification) {
			const timer = setTimeout(() => setNotification(null), 5000);
			return () => clearTimeout(timer);
		}
	}, [notification]);

	// Only show projects with status 'submitted'
	const submittedProjects = projects.filter((p) => p.status === "submitted");

	return (
		<Navigation>
			<main className="max-w-4xl mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-6">Project Verification</h1>
				<p className="mb-8 text-gray-600">
					Review your submitted projects and request on-chain verification.
				</p>
				{notification && (
					<div
						className={`mb-4 p-4 border ${
							notification.type === "success"
								? "border-green-500 bg-green-50 text-green-800"
								: "border-red-500 bg-red-50 text-red-800"
						}`}
					>
						<p>{notification.message}</p>
					</div>
				)}
				{submittedProjects.length === 0 ? (
					<div className="text-gray-500">No submitted projects awaiting verification.</div>
				) : (
					<div className="border border-black">
						<div className="bg-gray-50 px-6 py-4 border-b border-black">
							<h2 className="text-xl font-bold">Submitted Projects</h2>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="border-b border-black">
									<tr>
										<th className="text-left p-4 font-semibold">Project Name</th>
										<th className="text-left p-4 font-semibold">Type</th>
										<th className="text-left p-4 font-semibold">Location</th>
										<th className="text-left p-4 font-semibold">CO₂ Impact</th>
										<th className="text-left p-4 font-semibold">Actions</th>
									</tr>
								</thead>
								<tbody>
									{submittedProjects.map((project) => (
										<tr key={project.id}>
											<td className="p-4 font-medium">{project.name}</td>
											<td className="p-4 text-sm">{project.type}</td>
											<td className="p-4 text-sm">{project.location}</td>
											<td className="p-4 text-sm">{project.co2Amount.toLocaleString()} tons</td>
											<td className="p-4">
												<button
													onClick={() => handleVerify(project)}
													disabled={verifyLoading || verifyingId === project.id}
													className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
												>
													{verifyLoading && verifyingId === project.id
														? "Verifying..."
														: "Verify Project"}
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</main>
		</Navigation>
	);
}
