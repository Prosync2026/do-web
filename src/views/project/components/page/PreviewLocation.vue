<template>
    <div class="location-item">
        <div class="location-row" :style="{ paddingLeft: level * 20 + 'px', marginTop: level === 0 ? '20px' : '10px' }" v-tooltip="`This is Location ${level + 1}`">
            <!-- 展开/折叠按钮 -->
            <Button v-if="hasChildren" class="p-button-text p-button-sm toggle-btn" @click="toggleExpand">
                <template #icon>
                    <PhCaretDown v-if="isExpanded" />
                    <PhCaretRight v-else />
                </template>
            </Button>

            <!-- L 形箭头 -->
            <span v-if="level > 0" class="arrow"> └─ </span>

            <span>{{ location.name }}</span>
        </div>

        <!-- 遍历子级 -->
        <div v-show="isExpanded">
            <LocationItem v-for="(child, key) in location.children" :key="key" :location="child" :level="level + 1" />
        </div>
    </div>
</template>

<script lang="ts" src="./PreviewLocation.script.ts"></script>

<style scoped>
.location-item {
    margin-bottom: 5px;
}

.location-row {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.toggle-btn {
    margin-right: 5px;
}

.arrow {
    color: gray;
    margin-right: 5px;
}
</style>
