import { ApplicationsListHome } from "@/features/applications/components/app-list-home";
const minioUrl = process.env.IGRP_MINIO_URL;  
export default function Home() {
  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <ApplicationsListHome minioUrl={minioUrl} />
    </div>
  );
}
