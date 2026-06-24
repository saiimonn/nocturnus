import Search from "@/app/features/search/page";
import Nav from "@/components/UserNav";

export default function favoritesPage() {
    return (
        <div className="flex flex-col flex-1 bg-linear-to-b from-black to-[#202020] text-white">
            <Nav/>
            <div className = "flex flex-col flex-1 items-center justify-center px-6 -mt-24">
                <h1 className = "text-3xl md:text-4xl font-semibold mb-2 tracking-tight">
                    Your favorites
                </h1>

            </div>
        </div>
            
        )
}