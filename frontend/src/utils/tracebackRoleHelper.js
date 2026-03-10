
/**
 * Traceback Role Filtering Utility
 * Ensures data separation logic is consistent across views.
 */

export const getFilteredItems = (role, currentUserId, items) => {
    if (!items || !Array.isArray(items)) return [];

    // Normalize items if needed (handle both backend snake_case and potential frontend camelCase)
    const normalizedItems = items.map(item => ({
        ...item,
        reportedBy: item.reporter_id || item.reportedBy,
        reportedRole: item.reporter_role || item.reportedRole
    }));

    if (role === "resident") {
        // Residents only see their own items
        return normalizedItems.filter(item => item.reportedBy === currentUserId);
    }
    
    if (role === "security") {
        // Security only sees found items (Inventory)
        return normalizedItems.filter(item => item.type === "found");
    }
    
    if (role === "admin") {
        // Admin sees everything
        return normalizedItems;
    }

    return [];
};
