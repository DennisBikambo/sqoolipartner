/**
 * Seed Program Script
 * Creates a sample program with curriculum and subjects
 */

import { mutation } from "./_generated/server";

export const seedSampleProgram = mutation({
  args: {},
  handler: async (ctx) => {
    // First, check if there's already a curriculum, if not create one
    let curriculum = await ctx.db
      .query("curricula")
      .filter((q) => q.eq(q.field("name"), "Kenya National Curriculum"))
      .first();

    if (!curriculum) {
      const curriculumId = await ctx.db.insert("curricula", {
        name: "Kenya National Curriculum",
        description: "The official national curriculum for Kenya, covering primary and secondary education standards.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      curriculum = await ctx.db.get(curriculumId);
    }

    if (!curriculum) {
      throw new Error("Failed to create curriculum");
    }

    // Create subjects if they don't exist
    const subjectNames = ["Mathematics", "English", "Science", "Kiswahili"];
    const existingSubjects = await ctx.db.query("subjects").collect();
    const existingSubjectNames = existingSubjects.map((s) => s.name);

    for (const subjectName of subjectNames) {
      if (!existingSubjectNames.includes(subjectName)) {
        await ctx.db.insert("subjects", {
          name: subjectName,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Check if program already exists
    const existingProgram = await ctx.db
      .query("programs")
      .filter((q) => q.eq(q.field("name"), "Nov-Dec Holiday Tuition 2025"))
      .first();

    if (existingProgram) {
      return {
        success: true,
        message: "Program already exists",
        program_id: existingProgram._id,
        curriculum_id: curriculum._id,
      };
    }

    // Create the program
    const programId = await ctx.db.insert("programs", {
      name: "Nov-Dec Holiday Tuition 2025",
      curriculum_id: curriculum._id,
      start_date: "2025-11-01",
      end_date: "2025-12-19",
      pricing: 250,
      subjects: ["Mathematics", "English", "Science", "Kiswahili"],
      timetable: {
        Monday: [
          { subject: "Mathematics", time: "09:00-10:00" },
          { subject: "English", time: "10:30-11:30" },
        ],
        Tuesday: [
          { subject: "Science", time: "09:00-10:00" },
          { subject: "Kiswahili", time: "10:30-11:30" },
        ],
        Wednesday: [
          { subject: "Mathematics", time: "09:00-10:00" },
          { subject: "English", time: "10:30-11:30" },
        ],
        Thursday: [
          { subject: "Science", time: "09:00-10:00" },
          { subject: "Kiswahili", time: "10:30-11:30" },
        ],
        Friday: [
          { subject: "Mathematics", time: "09:00-10:00" },
          { subject: "English", time: "10:30-11:30" },
        ],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Sample program created successfully!",
      program_id: programId,
      curriculum_id: curriculum._id,
      subjects_created: subjectNames.filter((name) => !existingSubjectNames.includes(name)),
    };
  },
});

// Helper mutation to clear the sample program (for testing)
export const clearSampleProgram = mutation({
  args: {},
  handler: async (ctx) => {
    const program = await ctx.db
      .query("programs")
      .filter((q) => q.eq(q.field("name"), "Nov-Dec Holiday Tuition 2025"))
      .first();

    if (program) {
      await ctx.db.delete(program._id);
      return { success: true, message: "Sample program deleted" };
    }

    return { success: false, message: "Program not found" };
  },
});
