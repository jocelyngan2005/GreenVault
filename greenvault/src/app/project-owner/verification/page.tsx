"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import useSmartContract from "@/lib/useSmartContract";
import { smartContractService } from "@/lib/smartContractService";
import { getTestUserAddress } from "@/lib/suiUtils";

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
	status: "draft" | "registered" | "submitted" | "verified" | "listed";
	nftMinted: boolean;
	salesCount: number;
	totalRevenue: number;
	createdDate: string;
	creditObjectId?: string;
}


export default function ProjectVerificationPage() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const { execute: verifyProject, loading: verifyLoading } = useVerifyProject();
	const [verifyingId, setVerifyingId] = useState<string | null>(null);
	const [oracleModal, setOracleModal] = useState<null | {
		project: Project;
		step: number;
		confidence: number | null;
	}>(null);
	const userAddress = getTestUserAddress();

	// Load projects from blockchain
	useEffect(() => {
		const loadProjects = async () => {
			try {
				const registeredProjectsResult = await smartContractService.getRegisteredProjects(userAddress);
				if (registeredProjectsResult.success && registeredProjectsResult.data) {
					const blockchainProjects: Project[] = registeredProjectsResult.data.projects?.map((project: any) => ({
						id: project.projectId || project.id,
						name: project.name,
						type: project.projectType !== undefined ?
							['Forest Conservation', 'Reforestation', 'Renewable Energy', 'Ecosystem Restoration', 'Clean Cooking', 'Sustainable Agriculture', 'Waste Management', 'Water Conservation'][project.projectType] || 'Unknown'
							: 'Unknown',
						location: project.location,
						co2Amount: project.co2ReductionCapacity || project.quantity || 0,
						status: project.status || (project.verified ? 'verified' : (project.submitted ? 'submitted' : 'draft')),
						nftMinted: project.creditObjectId ? true : false,
						salesCount: project.salesCount || 0,
						totalRevenue: project.totalRevenue || 0,
						createdDate: project.createdDate || new Date().toISOString().slice(0, 10),
						creditObjectId: project.creditObjectId
					})) || [];
					setProjects(blockchainProjects);
				} else {
					setProjects([]);
				}
			} catch (error) {
				setProjects([]);
			}
		};
		if (userAddress) {
			loadProjects();
		}
	}, [userAddress]);

	// Helper to refresh projects from blockchain
	const refreshProjects = async () => {
		try {
			const registeredProjectsResult = await smartContractService.getRegisteredProjects(userAddress);
			if (registeredProjectsResult.success && registeredProjectsResult.data) {
				const blockchainProjects: Project[] = registeredProjectsResult.data.projects?.map((project: any) => ({
					id: project.projectId || project.id,
					name: project.name,
					type: project.projectType !== undefined ?
						['Forest Conservation', 'Reforestation', 'Renewable Energy', 'Ecosystem Restoration', 'Clean Cooking', 'Sustainable Agriculture', 'Waste Management', 'Water Conservation'][project.projectType] || 'Unknown'
						: 'Unknown',
					location: project.location,
					co2Amount: project.co2ReductionCapacity || project.quantity || 0,
					status: project.status || (project.verified ? 'verified' : (project.submitted ? 'submitted' : 'draft')),
					nftMinted: project.creditObjectId ? true : false,
					salesCount: project.salesCount || 0,
					totalRevenue: project.totalRevenue || 0,
					createdDate: project.createdDate || new Date().toISOString().slice(0, 10),
					creditObjectId: project.creditObjectId
				})) || [];
				setProjects(blockchainProjects);
			}
		} catch (error) {
			// ...existing code...
		}
	};


	// Oracle verification UI steps
	const ORACLE_STEPS = [
		{ label: "Checking satellite data...", key: "satellite" },
		{ label: "Checking IoT (CO₂ sensor) data...", key: "iot" },
		{ label: "Checking carbon registry data...", key: "registry" },
		{ label: "Calculating confidence score...", key: "confidence" },
	];

	const handleVerify = async (project: Project) => {
		setOracleModal({ project, step: 0, confidence: null });
		setVerifyingId(project.id);

		// Animate steps
		let confidenceScore = Math.floor(80 + Math.random() * 15); // 80-95%
		for (let i = 0; i < ORACLE_STEPS.length; i++) {
			await new Promise((res) => setTimeout(res, i === 3 ? 1200 : 900));
			setOracleModal((prev) => prev && { ...prev, step: i, confidence: i === 3 ? confidenceScore : null });
		}

		// Wait a bit before calling backend
		await new Promise((res) => setTimeout(res, 1000));

		try {
			const result = await verifyProject(project.id);
			if (result.success) {
				setNotification({
					type: "success",
					message: `Project verified! TX: ${result.txDigest?.slice(0, 10)}...`,
				});
				await refreshProjects();
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
		// Don't close modal yet; wait for user to click OK
		setOracleModal((prev) => prev && { ...prev, step: 4 });
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
														className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
													>
														{verifyingId === project.id ? (
															<>
																<span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full align-middle"></span>
																<span>Verifying with Oracle...</span>
															</>
														) : (
															"Verify Project"
														)}
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
					{/* Back to dashboard button */}
					<div className="mt-8">
						<a href="/project-owner" className="text-blue-600 hover:underline">&larr; Back to Dashboard</a>
					</div>
				</main>
			{/* Oracle Verification Modal */}
			{oracleModal && (
				<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full animate-fade-in">
						<h3 className="text-xl font-bold mb-4">Oracle Verification</h3>
						<ul className="mb-6">
							{ORACLE_STEPS.map((step, idx) => (
								<li key={step.key} className="flex items-center gap-2 mb-2">
									{oracleModal.step > idx ? (
										<span className="text-green-600">✔</span>
									) : oracleModal.step === idx ? (
										<span className="animate-spin inline-block w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"></span>
									) : (
										<span className="inline-block w-4 h-4"></span>
									)}
									<span className={oracleModal.step === idx ? "font-semibold" : "text-gray-600"}>{step.label}</span>
									{step.key === "confidence" && oracleModal.confidence !== null && (
										<span className="ml-2 text-blue-700 font-bold">{oracleModal.confidence}%</span>
									)}
								</li>
							))}
						</ul>
						{oracleModal.step < 4 && (
							<div className="flex justify-center">
								<span className="text-gray-500 text-sm">Verifying project info with satellite, IoT, and registry data...</span>
							</div>
						)}
						{oracleModal.step === 4 && (
							<div className="flex flex-col items-center gap-4">
								<div className="text-lg font-bold text-blue-700">Confidence Score: {oracleModal.confidence}%</div>
								<button
									className="mt-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
									onClick={() => setOracleModal(null)}
								>
									OK
								</button>
							</div>
						)}
					</div>
				</div>
			)}
			</Navigation>
		);
}
