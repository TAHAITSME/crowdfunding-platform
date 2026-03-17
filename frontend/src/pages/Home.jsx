import MainLayout from '../components/layouts/MainLayout'
import Feed from '../components/posts/Feed'
import SuggestedFriends from '../components/widgets/SuggestedFriends'
import TrendingCampaigns from '../components/widgets/TrendingCampaigns'

const RightSidebar = () => (
  <div className="pt-2">
    <SuggestedFriends />
    <TrendingCampaigns />
  </div>
)

export default function Home() {
  return (
    <MainLayout rightSidebar={<RightSidebar />}>
      <Feed />
    </MainLayout>
  )
}
