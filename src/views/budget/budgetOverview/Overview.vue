<script src="./Overview.script.ts"></script>

<template>
    <!--HEADER-->
    <div class="grid grid-cols-12 gap-4 mb-3 mt-4">
        <BudgetSummaryData :cardItems="BudgetSummaryDataList" :cardCol="3" />
    </div>

    <!-- BODY CHART -->
    <!-- <div class="grid grid-cols-12 gap-4 mt-6 items-stretch">
        
        <div class="col-span-12 lg:col-span-6 flex flex-col">
            <div class="glossy-card mb-0 p-4 rounded-lg border border-gray-300 relative flex-1 flex flex-col items-center">
                <span class="self-start font-bold text-black-500 mb-10"> <i class="pi pi-map-marker" style="margin-right: 5px"></i> Budget by Location </span>
                <div style="width: 100%; height: 324px; display: flex; justify-content: center; align-items: center">
                    <Chart type="pie" :data="pieData" :options="pieOptions" :style="{ width: '100%', maxWidth: '400px', height: '70%' }" />
                </div>
            </div>
        </div>

     
        <div class="col-span-12 lg:col-span-6 flex flex-col">
            <div class="glossy-card mb-0 p-4 rounded-lg border border-gray-300 relative flex-1 flex flex-col">
                <div class="w-full flex items-center justify-between mb-4">
                    <div>
                        <span class="font-bold text-black-500 block"> <i class="pi pi-eject mr-1"></i> {{ breadcrumbTitle }} </span>
                        <span class="font-small text-gray-500 block mt-1">Click on bars to drill down</span>
                        <div class="w-full flex items-center gap-2 text-sm text-gray-600 mt-2">
                            <span v-for="(p, index) in path" :key="index" class="cursor-pointer hover:underline" @click="goBackTo(index)"> {{ p }} <span v-if="index < path.length - 1"> &gt; </span> </span>
                        </div>
                    </div>
                    <Button v-if="level > 0" label="Back" icon="pi pi-arrow-left" class="p-button-sm" @click="goBack" />
                </div>
                <highcharts :options="chartOptions" :style="{ height: '300px', width: '100%' }" />
            </div>
        </div>
    </div> -->
</template>
