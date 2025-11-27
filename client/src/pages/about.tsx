import React from "react";

export default function About() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/5 py-16 px-4 flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold mb-4 text-primary drop-shadow">About ClassBeyond</h1>
          <p className="text-lg text-muted-foreground font-medium">Empowering education for every child, everywhere.</p>
        </div>
        <div className="grid gap-8">
          <div className="rounded-xl shadow-lg bg-white/90 backdrop-blur p-8 border border-primary/20">
            <h2 className="text-2xl font-bold mb-3">System Description</h2>
            <p className="text-lg text-muted-foreground">
              ClassBeyond is an online digital education platform designed to empower refugee and underprivileged children. It provides free lessons, interactive quizzes, and mentorship, making quality learning accessible even in areas with limited internet connectivity.
            </p>
          </div>
          <div className="rounded-xl shadow-lg bg-white/90 backdrop-blur p-8 border border-primary/20">
            <h2 className="text-2xl font-bold mb-3">Problem Statement</h2>
            <p className="text-lg text-muted-foreground">
              Millions of children in refugee camps and underserved communities lack access to quality education due to poor infrastructure, limited resources, and unreliable internet connectivity.
            </p>
            <h3 className="text-xl font-semibold mt-6 mb-2">Why is it a problem?</h3>
            <p className="text-lg text-muted-foreground">
              Without access to education, these children face barriers to personal growth, future opportunities, and breaking the cycle of poverty. The lack of digital resources and mentorship further widens the gap between them and their peers in better-served regions.
            </p>
          </div>
          <div className="rounded-xl shadow-lg bg-white/90 backdrop-blur p-8 border border-primary/20">
            <h2 className="text-2xl font-bold mb-3">Proposed Solution</h2>
            <p className="text-lg text-muted-foreground">
              ClassBeyond delivers curriculum-aligned lessons, interactive quizzes, and expert mentorship in a web platform. By providing free access, it ensures every child can learn, regardless of their circumstances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
