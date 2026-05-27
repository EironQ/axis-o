import HeroSection from '@/components/home/HeroSection'
import EcoSection from '@/components/home/EcoSection'
import CollectionSection from '@/components/home/CollectionSection'
import QualitySection from '@/components/home/QualitySection'
import BestSellersSection from '@/components/home/BestSellersSection'
import PracticalSection from '@/components/home/PracticalSection'
import BrandStorySection from '@/components/home/BrandStorySection'

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <EcoSection />
      <CollectionSection />
      <QualitySection />
      <BestSellersSection />
      <PracticalSection />
      <BrandStorySection />
    </main>
  )
}
