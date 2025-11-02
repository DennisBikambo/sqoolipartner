import {query} from "./_generated/server";
import {v} from "convex/values";



export const getAssetsByCampaign = query({
    args:{
        campaign_id: v.id("campaigns")
    },
    handler: async (ctx,args) =>{

        const assets = await ctx.db.query("assets").withIndex("by_campaign_id",(q) => q.eq("campaign_id",args.campaign_id)).collect()

        return assets
    }
})