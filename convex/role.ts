// convex/role.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * ➕ Create a new role
 */
export const createRole = mutation({
  args: {
    name: v.string(),
    display_name: v.string(),
    description: v.string(),
    permission_ids: v.array(v.id("permissions")),
    is_system_role: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if role with this name already exists
    const existingRole = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (existingRole) {
      throw new Error(`Role with name "${args.name}" already exists`);
    }

    // Validate that all permission IDs exist
    const permissions = await Promise.all(
      args.permission_ids.map((id) => ctx.db.get(id))
    );

    const invalidPermissions = permissions.filter((p) => !p);
    if (invalidPermissions.length > 0) {
      throw new Error("One or more permission IDs are invalid");
    }

    const roleId = await ctx.db.insert("roles", {
      name: args.name,
      display_name: args.display_name,
      description: args.description,
      permission_ids: args.permission_ids,
      is_system_role: args.is_system_role ?? false,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    return {
      message: "Role created successfully",
      roleId,
    };
  },
});

/**
 * 📄 Get all roles
 */
export const getRoles = query({
  args: {
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let roles;

    if (args.is_active !== undefined) {
      roles = await ctx.db
        .query("roles")
        .withIndex("by_is_active", (q) => q.eq("is_active", args.is_active!))
        .collect();
    } else {
      roles = await ctx.db.query("roles").collect();
    }

    // Expand permission details for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await Promise.all(
          role.permission_ids.map((id) => ctx.db.get(id))
        );
        return {
          ...role,
          permissions: permissions.filter(Boolean),
        };
      })
    );

    return rolesWithPermissions;
  },
});

/**
 * 📄 Get a single role by ID
 */
export const getRoleById = query({
  args: { role_id: v.id("roles") },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.role_id);
    if (!role) throw new Error("Role not found");

    // Fetch permissions linked to the role
    const permissions = await Promise.all(
      role.permission_ids.map((id) => ctx.db.get(id))
    );

    return {
      ...role,
      permissions: permissions.filter(Boolean),
    };
  },
});

/**
 * 📄 Get a role by name
 */
export const getRoleByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (!role) throw new Error(`Role "${args.name}" not found`);

    // Fetch permissions linked to the role
    const permissions = await Promise.all(
      role.permission_ids.map((id) => ctx.db.get(id))
    );

    return {
      ...role,
      permissions: permissions.filter(Boolean),
    };
  },
});

/**
 * ✏️ Update a role
 */
export const updateRole = mutation({
  args: {
    role_id: v.id("roles"),
    display_name: v.optional(v.string()),
    description: v.optional(v.string()),
    permission_ids: v.optional(v.array(v.id("permissions"))),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { role_id, ...fields } = args;
    const existingRole = await ctx.db.get(role_id);

    if (!existingRole) throw new Error("Role not found");

    // Prevent updating system roles' core properties
    if (existingRole.is_system_role && fields.permission_ids) {
      throw new Error(
        "Cannot modify permissions of system roles. Create a custom role instead."
      );
    }

    // Validate permission IDs if provided
    if (fields.permission_ids) {
      const permissions = await Promise.all(
        fields.permission_ids.map((id) => ctx.db.get(id))
      );
      const invalidPermissions = permissions.filter((p) => !p);
      if (invalidPermissions.length > 0) {
        throw new Error("One or more permission IDs are invalid");
      }
    }

    const patchData: Partial<typeof existingRole> = {};
    (Object.keys(fields) as Array<keyof typeof fields>).forEach((key) => {
      const value = fields[key];
      if (value !== undefined) {
        (patchData[key] as typeof value) = value;
      }
    });

    patchData.updated_at = new Date().toISOString();
    await ctx.db.patch(role_id, patchData);

    return {
      message: "Role updated successfully",
      updatedFields: patchData,
    };
  },
});

/**
 * ❌ Delete a role
 */
export const deleteRole = mutation({
  args: { role_id: v.id("roles") },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.role_id);

    if (!role) throw new Error("Role not found");

    // Prevent deleting system roles
    if (role.is_system_role) {
      throw new Error("Cannot delete system roles");
    }

    // Check if any users are assigned this role (by checking the role field in users table)
    const usersWithRole = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", role.name as any))
      .collect();

    if (usersWithRole.length > 0) {
      throw new Error(
        `Cannot delete role "${role.display_name}". It is assigned to ${usersWithRole.length} user(s).`
      );
    }

    await ctx.db.delete(args.role_id);

    return {
      message: "Role deleted successfully",
    };
  },
});

/**
 * 🔄 Assign permissions to a role
 */
export const assignPermissionsToRole = mutation({
  args: {
    role_id: v.id("roles"),
    permission_ids: v.array(v.id("permissions")),
  },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.role_id);

    if (!role) throw new Error("Role not found");

    if (role.is_system_role) {
      throw new Error(
        "Cannot modify permissions of system roles. Create a custom role instead."
      );
    }

    // Validate all permission IDs exist
    const permissions = await Promise.all(
      args.permission_ids.map((id) => ctx.db.get(id))
    );

    const invalidPermissions = permissions.filter((p) => !p);
    if (invalidPermissions.length > 0) {
      throw new Error("One or more permission IDs are invalid");
    }

    await ctx.db.patch(args.role_id, {
      permission_ids: args.permission_ids,
      updated_at: new Date().toISOString(),
    });

    return {
      message: "Permissions assigned to role successfully",
    };
  },
});
